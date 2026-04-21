import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const captureMode = process.env.CAPTURE_MODE || 'section';
const outputDirByMode = {
  section: path.join(rootDir, 'captures', 'homepage'),
  landscape: path.join(rootDir, 'captures', 'homepage-1920x1080'),
  storyboard: path.join(rootDir, 'captures', 'homepage-storyboard-1920x1080'),
};
const outputDir = outputDirByMode[captureMode] || outputDirByMode.section;
const pageUrl = process.env.CAPTURE_URL || 'http://127.0.0.1:4174/';

const shots = [
  { name: '01-hero', selector: 'main > section:nth-of-type(1)', align: 'top', offset: 0 },
  { name: '02-stats', selector: 'main > section:nth-of-type(2)', align: 'center', offset: 0 },
  { name: '03-about', selector: '#about', align: 'top', offset: -64 },
  { name: '04-process', selector: 'main > section:nth-of-type(4)', align: 'center', offset: 0 },
  { name: '05-services', selector: '#services', align: 'top', offset: -64 },
  { name: '06-portfolio', selector: '#portfolio', align: 'top', offset: -64 },
  { name: '07-partners', selector: 'main > section:nth-of-type(7)', align: 'center', offset: 0 },
  { name: '08-strengths', selector: 'main > section:nth-of-type(8)', align: 'center', offset: 0 },
  { name: '09-contact-cta', selector: 'main > section:nth-of-type(9)', align: 'center', offset: 0 },
  { name: '10-contact', selector: '#contact', align: 'center', offset: 0 },
];

async function waitForStablePage(page) {
  await page.goto(pageUrl, { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    if (document.fonts?.ready) {
      await document.fonts.ready;
    }
  });
  await page.waitForTimeout(800);
}

async function captureSection(page, shot) {
  const locator = page.locator(shot.selector).first();
  const viewport = page.viewportSize();

  if (!viewport) {
    throw new Error('Viewport is not available');
  }

  const metrics = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      height: rect.height,
      scrollHeight: document.documentElement.scrollHeight,
    };
  });

  const clampY = (value) => Math.max(0, Math.min(value, metrics.scrollHeight - viewport.height));

  if (captureMode === 'storyboard') {
    const segmentPadding = 32;
    const step = Math.max(640, viewport.height - 220);
    const startY = clampY(metrics.top - segmentPadding);
    const endY = clampY(metrics.top + metrics.height - viewport.height + segmentPadding);

    let positions = [];

    if (metrics.height <= viewport.height * 0.88) {
      positions = [clampY(metrics.top + metrics.height / 2 - viewport.height / 2)];
    } else {
      positions.push(startY);

      let cursor = startY + step;
      while (cursor < endY) {
        positions.push(clampY(cursor));
        cursor += step;
      }

      if (positions[positions.length - 1] !== endY) {
        positions.push(endY);
      }
    }

    positions = positions.filter((position, index) => index === 0 || position - positions[index - 1] >= 180);

    for (const [index, y] of positions.entries()) {
      await page.evaluate((nextY) => {
        window.scrollTo(0, nextY);
      }, y);
      await page.waitForTimeout(700);
      await page.screenshot({
        path: path.join(outputDir, `${shot.name}-${String(index + 1).padStart(2, '0')}.png`),
        fullPage: false,
      });
    }

    return;
  }

  if (captureMode === 'landscape') {
    let targetY = metrics.top;

    if (shot.align === 'center') {
      targetY = metrics.top + metrics.height / 2 - viewport.height / 2;
    }

    if (shot.align === 'bottom') {
      targetY = metrics.top + metrics.height - viewport.height;
    }

    targetY = clampY(targetY + (shot.offset || 0));

    await page.evaluate((y) => {
      window.scrollTo(0, y);
    }, targetY);
    await page.waitForTimeout(700);

    await page.screenshot({
      path: path.join(outputDir, `${shot.name}.png`),
      fullPage: false,
    });
    return;
  }

  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await locator.screenshot({
    path: path.join(outputDir, `${shot.name}.png`),
  });
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });

  const isWideCapture = captureMode === 'landscape' || captureMode === 'storyboard';
  const page = await browser.newPage({
    viewport: isWideCapture ? { width: 1920, height: 1080 } : { width: 1600, height: 1200 },
    deviceScaleFactor: isWideCapture ? 1 : 2,
  });

  try {
    await waitForStablePage(page);

    for (const shot of shots) {
      await captureSection(page, shot);
    }

    console.log(`Saved ${shots.length} screenshots to ${outputDir}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
