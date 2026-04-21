#!/usr/bin/env python3

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

import requests

BASE_URL = "https://chrisandpartners.co"
WORKS_URL = f"{BASE_URL}/works/"
DEFAULT_OUTPUT = Path("data/chris-works.json")
DEFAULT_IMAGE_DIR = Path("public/chris-works")
USER_AGENT = "Mozilla/5.0 (compatible; JSHomepageImporter/1.0; +https://chrisandpartners.co)"
PROJECT_LABELS = ("Host & Organizer", "Date", "Venue", "Project Scope", "Participant")
CARD_RE = re.compile(
    r'<div class="col span_4[^"]*?element(?P<class_categories>[^"]*?)"\s+'
    r'data-project-cat="(?P<data_categories>[^"]*?)"[^>]*>'
    r'.*?<div class="work-item style-4"[^>]*>\s*(?P<img_tag><img[^>]+>)\s*'
    r'<div class="work-info">.*?<a href="(?P<link>https://chrisandpartners\.co/portfolio/[^"]+)"></a>'
    r'.*?<h3>(?P<title>.*?)</h3>',
    re.S,
)


def fetch_text(url: str) -> str:
    response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60)
    response.raise_for_status()
    response.encoding = response.encoding or "utf-8"
    return response.text


def download_binary(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    response = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=60)
    response.raise_for_status()
    destination.write_bytes(response.content)


def clean_text(raw: str) -> str:
    value = re.sub(r"(?is)<(script|style).*?>.*?</\\1>", "", raw)
    value = re.sub(r"(?i)<br\\s*/?>", "\n", value)
    value = re.sub(r"(?s)<[^>]+>", "", value)
    value = html.unescape(value)
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t\r\f\v]+", " ", value)
    value = re.sub(r" *\n *", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def extract_attr(tag: str, attr: str) -> str:
    match = re.search(rf'\b{re.escape(attr)}="([^"]+)"', tag)
    if match:
        return html.unescape(match.group(1).strip())
    match = re.search(rf"\b{re.escape(attr)}='([^']+)'", tag)
    if match:
        return html.unescape(match.group(1).strip())
    return ""


def extract_meta(document: str, attr_name: str, attr_value: str) -> str:
    match = re.search(
        rf'<meta[^>]+{re.escape(attr_name)}="{re.escape(attr_value)}"[^>]+content="([^"]+)"',
        document,
        re.I,
    )
    if match:
        return html.unescape(match.group(1).strip())
    return ""


def parse_srcset(srcset: str) -> list[tuple[int | None, str]]:
    entries: list[tuple[int | None, str]] = []
    for candidate in srcset.split(","):
        parts = candidate.strip().split()
        if not parts:
            continue
        url = parts[0]
        width = None
        if len(parts) > 1 and parts[1].endswith("w"):
            try:
                width = int(parts[1][:-1])
            except ValueError:
                width = None
        entries.append((width, url))
    return entries


def choose_image_url(tag: str, preferred_widths: tuple[int, ...]) -> str:
    for attr in ("srcset", "data-srcset"):
        srcset = extract_attr(tag, attr)
        if not srcset:
            continue
        candidates = parse_srcset(srcset)
        for width in preferred_widths:
            for candidate_width, candidate_url in candidates:
                if candidate_width == width:
                    return candidate_url
        if candidates:
            return candidates[0][1]

    for attr in ("src", "data-src", "data-bg"):
        value = extract_attr(tag, attr)
        if value:
            return value

    return ""


def slug_from_url(url: str) -> str:
    return unquote(urlparse(url).path.rstrip("/").split("/")[-1])


def guess_extension(url: str) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    if suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        return suffix
    return ".jpg"


def relative_public_path(path: Path) -> str:
    return "/" + path.as_posix().removeprefix("public/")


def extract_label_value(document: str, label: str) -> str:
    match = re.search(
        rf"<h5[^>]*>\s*{re.escape(label)}\s*</h5>\s*<p[^>]*>\s*(.*?)\s*</p>",
        document,
        re.S,
    )
    if not match:
        return ""
    return clean_text(match.group(1))


def parse_detail_page(url: str) -> dict[str, object]:
    document = fetch_text(url)

    project_meta = {label: extract_label_value(document, label) for label in PROJECT_LABELS}
    anchor = 0
    for label in PROJECT_LABELS:
        idx = document.find(label)
        if idx != -1:
            anchor = max(anchor, idx)

    detail_slice = document[anchor:] if anchor else document

    body_html = ""
    body_match = re.search(
        r'<div class="wpb_text_column\b[^>]*>\s*<div class="wpb_wrapper">\s*(.*?)\s*</div>\s*</div>',
        detail_slice,
        re.S,
    )
    if body_match:
        body_html = body_match.group(1)

    paragraphs = [
        paragraph
        for paragraph in (clean_text(raw) for raw in re.findall(r"<p[^>]*>(.*?)</p>", body_html, re.S))
        if paragraph
    ]

    nav_start = document.find('id="portfolio-nav"', anchor if anchor else 0)
    gallery_slice = document[anchor:nav_start] if nav_start != -1 else detail_slice
    gallery_images: list[str] = []
    for img_tag in re.findall(r"<img\b[^>]+>", gallery_slice, re.S):
        image_url = choose_image_url(img_tag, preferred_widths=(900, 675, 600, 400))
        if "/wp-content/uploads/" not in image_url:
            continue
        if image_url not in gallery_images:
            gallery_images.append(image_url)

    return {
        "description": extract_meta(document, "name", "description"),
        "ogImage": extract_meta(document, "property", "og:image"),
        "publishedAt": extract_meta(document, "property", "article:published_time"),
        "modifiedAt": extract_meta(document, "property", "article:modified_time"),
        "meta": project_meta,
        "paragraphs": paragraphs,
        "body": "\n\n".join(paragraphs),
        "galleryImages": gallery_images,
    }


def parse_listing(document: str) -> list[dict[str, object]]:
    seen_links: set[str] = set()
    items: list[dict[str, object]] = []

    for match in CARD_RE.finditer(document):
        link = match.group("link")
        if link in seen_links:
            continue
        seen_links.add(link)

        img_tag = match.group("img_tag")
        item = {
            "slug": slug_from_url(link),
            "title": clean_text(match.group("title")),
            "link": link,
            "thumbnailUrl": choose_image_url(img_tag, preferred_widths=(900, 600, 400)),
            "thumbnailAlt": clean_text(extract_attr(img_tag, "alt")),
            "categorySlugs": [value for value in match.group("data_categories").split() if value],
        }
        items.append(item)

    return items


def hydrate_items(
    items: list[dict[str, object]],
    image_dir: Path,
    download_mode: str,
) -> list[dict[str, object]]:
    hydrated: list[dict[str, object]] = []

    for index, item in enumerate(items, start=1):
        title = item["title"]
        print(f"[{index}/{len(items)}] Importing {title}", file=sys.stderr)
        detail = parse_detail_page(str(item["link"]))
        slug = str(item["slug"])

        thumbnail_local = ""
        thumbnail_url = str(item["thumbnailUrl"])
        if download_mode in {"thumbnails", "full"} and thumbnail_url:
            thumb_path = image_dir / slug / f"thumb{guess_extension(thumbnail_url)}"
            if not thumb_path.exists():
                download_binary(thumbnail_url, thumb_path)
            thumbnail_local = relative_public_path(thumb_path)

        gallery_entries: list[dict[str, str]] = []
        for image_index, image_url in enumerate(detail["galleryImages"], start=1):
            local_path = ""
            if download_mode == "full":
                gallery_path = image_dir / slug / f"gallery-{image_index:02d}{guess_extension(image_url)}"
                if not gallery_path.exists():
                    download_binary(image_url, gallery_path)
                local_path = relative_public_path(gallery_path)
            gallery_entries.append({"remote": image_url, "local": local_path})

        hydrated.append(
            {
                **item,
                "thumbnailLocal": thumbnail_local,
                "description": detail["description"],
                "meta": detail["meta"],
                "paragraphs": detail["paragraphs"],
                "body": detail["body"],
                "heroImage": detail["ogImage"],
                "galleryImages": gallery_entries,
            }
        )

    return hydrated


def build_payload(items: list[dict[str, object]]) -> dict[str, object]:
    return {
        "source": WORKS_URL,
        "importedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "count": len(items),
        "items": items,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Import Chris & Partners works portfolio into local JSON.")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT), help="JSON output path")
    parser.add_argument(
        "--image-dir",
        default=str(DEFAULT_IMAGE_DIR),
        help="Directory for downloaded images under public/",
    )
    parser.add_argument(
        "--download-mode",
        choices=("none", "thumbnails", "full"),
        default="thumbnails",
        help="Choose whether to download no images, thumbnails only, or all gallery images",
    )
    parser.add_argument("--limit", type=int, default=0, help="Optional item limit for testing")
    args = parser.parse_args()

    listing_document = fetch_text(WORKS_URL)
    items = parse_listing(listing_document)
    if args.limit > 0:
        items = items[: args.limit]

    hydrated_items = hydrate_items(items, image_dir=Path(args.image_dir), download_mode=args.download_mode)
    payload = build_payload(hydrated_items)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(
        f"Imported {payload['count']} portfolio items into {output_path} "
        f"with download mode '{args.download_mode}'.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
