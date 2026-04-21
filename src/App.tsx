import { useEffect, useMemo, useState } from 'react';
import {
  Menu,
  X,
  CheckCircle2,
  Globe,
  Users,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  LayoutGrid,
  Presentation,
  Building2,
  Tent,
  Settings,
  PenTool,
  Calendar,
  Award,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import worksPayload from '../data/chris-works.json';

type ImportedWork = {
  title: string;
  link: string;
  thumbnailUrl: string;
  thumbnailLocal: string;
  categorySlugs: string[];
  description: string;
  paragraphs: string[];
  meta: {
    Date?: string;
    Venue?: string;
    Participant?: string;
    'Project Scope'?: string;
  };
};

type PortfolioProject = {
  title: string;
  link: string;
  image: string;
  category: string;
  filterKey: string;
  desc: string;
  date: string;
  venue: string;
  participants: string;
};

type PortfolioFilter = {
  label: string;
  key: string;
};

const importedWorks = worksPayload.items as ImportedWork[];

const portfolioFilters: PortfolioFilter[] = [
  { label: '전체', key: 'all' },
  { label: '컨퍼런스/국제회의', key: 'conference' },
  { label: '기업행사/시상식', key: 'corporate' },
  { label: 'IR/투자행사', key: 'ir-event' },
  { label: '블록체인/Web3', key: 'blockchain' },
  { label: '학술행사', key: 'academic' },
  { label: '문화/예술/전시', key: 'culture' },
];

const portfolioCategoryMap: Record<string, string> = {
  conference: '컨퍼런스/국제회의',
  corporate: '기업행사/시상식',
  'ir-event': 'IR/투자행사',
  blockchain: '블록체인/Web3',
  academic: '학술행사',
  culture: '문화/예술/전시',
};

const homeHref = import.meta.env.BASE_URL || '/';

function resolveAssetPath(path: string) {
  if (!path || /^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:')) {
    return path;
  }

  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}${path.replace(/^\/+/, '')}`;
}

function getPrimaryPortfolioCategory(categories: string[]) {
  const priority = ['conference', 'corporate', 'ir-event', 'blockchain', 'academic', 'culture'];

  for (const key of priority) {
    if (categories.includes(key)) {
      return key;
    }
  }

  return 'conference';
}

function parseDateValue(value: string) {
  const fullDate = value.match(/(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/);

  if (fullDate) {
    return Date.UTC(Number(fullDate[1]), Number(fullDate[2]) - 1, Number(fullDate[3]));
  }

  const yearOnly = value.match(/(20\d{2})/);
  if (yearOnly) {
    return Date.UTC(Number(yearOnly[1]), 0, 1);
  }

  return 0;
}

function trimText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trimEnd()}...`;
}

function buildPortfolioProjects() {
  return [...importedWorks]
    .sort((left, right) => parseDateValue(right.meta.Date ?? '') - parseDateValue(left.meta.Date ?? ''))
    .map((item) => {
      const filterKey = getPrimaryPortfolioCategory(item.categorySlugs);
      const category = portfolioCategoryMap[filterKey] ?? '컨퍼런스/국제회의';
      const description = item.paragraphs[0] || item.description || item.meta['Project Scope'] || '행사 기획 및 운영';

      return {
        title: item.title,
        link: item.link,
        image: resolveAssetPath(item.thumbnailLocal || item.thumbnailUrl),
        category,
        filterKey,
        desc: trimText(description, 96),
        date: item.meta.Date || '일정 비공개',
        venue: item.meta.Venue || '장소 비공개',
        participants: item.meta.Participant || '규모 비공개',
      } satisfies PortfolioProject;
    });
}

const portfolioProjects = buildPortfolioProjects();
const portfolioHistory = portfolioProjects.map((project) => project.title);
const portfolioYears = portfolioProjects
  .map((project) => project.date.match(/(20\d{2})/)?.[1])
  .filter((value): value is string => Boolean(value));

const latestPortfolioYear = portfolioYears[0] || '2025';
const earliestPortfolioYear = portfolioYears[portfolioYears.length - 1] || '2013';

const Stats = () => {
  const stats = [
    { label: 'PORTFOLIO ARCHIVE', value: `${portfolioProjects.length}+` },
    { label: 'YEARS OF EXPERIENCE', value: '12+' },
    { label: 'ARCHIVE RANGE', value: `${earliestPortfolioYear}-${latestPortfolioYear}` },
    { label: 'PROJECT LANES', value: '6' },
  ];

  return (
    <section className="py-24 bg-brand-navy text-white">
      <div className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center"
            >
              <p className="text-4xl md:text-5xl font-bold mb-3 tracking-tighter text-brand-accent">{stat.value}</p>
              <p className="text-[10px] tracking-[0.3em] text-gray-400 font-bold uppercase">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'ABOUT', href: '#about' },
    { name: 'SERVICES', href: '#services' },
    { name: 'PORTFOLIO', href: '#portfolio' },
    { name: 'CONTACT', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-5' : 'bg-transparent py-8'
      }`}
    >
      <div className="container-custom flex justify-between items-center">
        <a href={homeHref} className="flex items-center gap-4 group">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <img src={resolveAssetPath('/logo.png')} alt="JS&PARTNERS Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <span
              className={`font-bold text-sm tracking-[0.3em] transition-colors duration-500 ${
                isScrolled ? 'text-brand-navy' : 'text-white'
              }`}
            >
              JS&amp;PARTNERS
            </span>
            <span
              className={`text-[7px] tracking-[0.5em] font-medium transition-colors duration-500 ${
                isScrolled ? 'text-gray-400' : 'text-white/40'
              }`}
            >
              EXCELLENCE IN PLANNING
            </span>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-12">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`text-[11px] font-bold tracking-[0.2em] transition-colors hover:text-brand-accent ${
                isScrolled ? 'text-brand-dark' : 'text-white'
              }`}
            >
              {link.name}
            </a>
          ))}
          <a href="#contact" className="btn-primary !py-2.5 !px-6">
            INQUIRY
          </a>
        </nav>

        <button
          className={`md:hidden p-2 ${isScrolled ? 'text-brand-dark' : 'text-white'}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-white shadow-xl py-8 px-6 md:hidden flex flex-col gap-6"
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-lg font-medium text-brand-dark border-b border-gray-100 pb-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a href="#contact" className="btn-primary text-center" onClick={() => setIsMobileMenuOpen(false)}>
              행사 문의하기
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-brand-dark">
      <div className="absolute inset-0 z-0">
        <img
          src={resolveAssetPath('/public-communication.png')}
          alt="Event Background"
          className="w-full h-full object-cover opacity-30 grayscale"
        />
        <div className="absolute inset-0 bg-brand-dark/40" />
      </div>

      <div className="container-custom relative z-10 text-center">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block tracking-[0.5em] text-brand-accent text-[10px] font-bold uppercase mb-10 border-x border-brand-accent px-6">
              Excellence in Event Planning
            </span>
            <h1 className="text-6xl md:text-[110px] font-bold text-white leading-[0.95] mb-12 tracking-tighter">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="block"
              >
                행사의 가치를
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-brand-accent block"
              >
                완성하는 기획사
              </motion.span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-16 max-w-2xl mx-auto font-light">
              JS&amp;PARTNERS는 기획의 본질에 집중하여 완성도 높은 현장 실행을 보장합니다. 정부 포럼부터 대형 전시까지,
              귀하의 비전을 가장 빛나는 현실로 만듭니다.
            </p>
            <div className="flex flex-col sm:flex-row gap-8 justify-center">
              <a href="#portfolio" className="btn-primary flex items-center justify-center gap-4 group">
                VIEW PORTFOLIO
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#contact"
                className="btn-outline border-white/40 text-white hover:bg-white hover:text-brand-dark flex items-center justify-center"
              >
                GET IN TOUCH
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6"
      >
        <span className="text-[8px] tracking-[0.4em] text-gray-400 uppercase">Scroll Down</span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-brand-accent to-transparent opacity-50" />
      </motion.div>
    </section>
  );
};

const About = () => {
  const values = [
    {
      title: 'STRATEGIC PLANNING',
      desc: '행사의 본질을 꿰뚫는 전략적 기획으로 참여자에게 잊지 못할 경험을 설계합니다.',
      icon: <Presentation className="text-brand-accent" size={24} />,
    },
    {
      title: 'PRECISE OPERATION',
      desc: '0.1%의 오차도 허용하지 않는 정교한 운영 프로세스로 현장의 안정을 책임집니다.',
      icon: <Settings className="text-brand-accent" size={24} />,
    },
    {
      title: 'TRUSTED EXECUTION',
      desc: '공공과 기업을 아우르는 수많은 성공 사례가 JS&PARTNERS의 신뢰를 증명합니다.',
      icon: <CheckCircle2 className="text-brand-accent" size={24} />,
    },
  ];

  return (
    <section id="about" className="section-padding bg-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-brand-accent font-bold text-xs tracking-[0.3em] mb-6 uppercase">PHILOSOPHY</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-brand-dark leading-[1.2] mb-10 tracking-tight">
              기획의 깊이가
              <br />
              현장의 가치를 결정합니다
            </h3>
            <div className="space-y-8 text-gray-500 leading-relaxed font-light text-lg">
              <p>
                제이에스파트너스는 포럼, 컨퍼런스, 전시, 기업행사 등 다양한 프로젝트를 기획하고 운영하는 전문
                파트너입니다.
              </p>
              <p>
                단순한 운영 대행을 넘어, 행사의 목적과 대상, 예산과 운영 환경을 종합적으로 고려해 가장 효과적인 실행
                방안을 설계합니다. 메시지가 살아 있는 행사 경험을 만드는 것이 우리의 사명입니다.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] bg-brand-gray-light overflow-hidden">
              <img
                src={resolveAssetPath('/asia-art.png')}
                alt="Professional Space"
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000"
              />
            </div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-navy -z-10 hidden md:block" />
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {values.map((value, idx) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div className="mb-8 flex items-center gap-4">
                <div className="w-10 h-[1px] bg-brand-accent group-hover:w-16 transition-all duration-500" />
                <span className="text-[10px] font-bold tracking-[0.2em] text-brand-accent">{value.title}</span>
              </div>
              <h4 className="text-xl font-bold text-brand-dark mb-6 tracking-tight">
                {value.title === 'STRATEGIC PLANNING'
                  ? '전략적 기획'
                  : value.title === 'PRECISE OPERATION'
                    ? '정교한 운영'
                    : '신뢰 기반 실행'}
              </h4>
              <p className="text-gray-500 leading-relaxed text-sm font-light">{value.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Process = () => {
  const steps = [
    { number: '01', title: 'CONSULTATION', desc: '고객의 니즈와 행사의 목적을 심층 분석하여 최적의 방향성을 설정합니다.' },
    { number: '02', title: 'STRATEGY', desc: '차별화된 컨셉과 실질적인 운영 전략을 수립하여 기획안을 도출합니다.' },
    { number: '03', title: 'DESIGN', desc: '공간, 비주얼, 프로그램 등 행사의 모든 요소를 정교하게 디자인합니다.' },
    { number: '04', title: 'EXECUTION', desc: '철저한 리허설과 현장 관리를 통해 완벽한 행사를 실현합니다.' },
  ];

  return (
    <section className="section-padding bg-white overflow-hidden">
      <div className="container-custom">
        <div className="flex flex-col justify-between items-start mb-24 gap-12">
          <div className="max-w-2xl">
            <h2 className="text-brand-accent font-bold text-[10px] tracking-[0.4em] mb-8 uppercase">OUR PROCESS</h2>
            <h3 className="text-4xl md:text-6xl font-bold text-brand-dark tracking-tighter mb-8">
              성공을 위한
              <br />
              정교한 프로세스
            </h3>
            <p className="text-gray-500 font-light text-lg leading-relaxed">
              JS&amp;PARTNERS는 체계적인 4단계 프로세스를 통해 기획의 완성도와 현장의 안정성을 동시에 확보합니다.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-px bg-brand-gray-border border border-brand-gray-border">
          {steps.map((step, idx) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-12 group hover:bg-brand-navy transition-colors duration-700"
            >
              <span className="text-4xl font-bold text-brand-gray-border group-hover:text-white/10 transition-colors duration-700 mb-12 block">
                {step.number}
              </span>
              <h4 className="text-lg font-bold text-brand-dark group-hover:text-brand-accent transition-colors duration-700 mb-6 tracking-tight">
                {step.title}
              </h4>
              <p className="text-gray-500 group-hover:text-gray-400 transition-colors duration-700 text-sm leading-relaxed font-light">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Services = () => {
  const services = [
    {
      title: '정부 포럼 · 공공행사',
      desc: '정책 포럼, 공공 캠페인, 기관 행사 등 공공 프로젝트에 적합한 체계적인 기획과 운영을 제공합니다.',
      icon: <Globe size={20} />,
    },
    {
      title: '기업행사 · 컨퍼런스',
      desc: '브랜드 행사, 창립기념식, 세미나, 컨퍼런스, 네트워킹 행사 등 기업 맞춤형 이벤트를 기획합니다.',
      icon: <Building2 size={20} />,
    },
    {
      title: '전시 · 박람회',
      desc: '전시 기획, 공간 구성, 동선 설계, 현장 운영까지 전시와 박람회의 전 과정을 지원합니다.',
      icon: <LayoutGrid size={20} />,
    },
    {
      title: '지역축제 · 문화행사',
      desc: '지역성과 참여 경험을 살린 축제와 문화행사를 기획하고 현장에 맞게 운영합니다.',
      icon: <Tent size={20} />,
    },
    {
      title: '행사 운영 대행',
      desc: '기획안이 있는 프로젝트도 안정적인 현장 운영과 실행 중심 관리로 완성도를 높입니다.',
      icon: <Users size={20} />,
    },
    {
      title: '홍보물 · 현장 제작물',
      desc: '키비주얼, 배너, 사인물, 안내물 등 행사에 필요한 커뮤니케이션 제작물도 함께 제안합니다.',
      icon: <PenTool size={20} />,
    },
  ];

  return (
    <section id="services" className="section-padding bg-brand-gray-light">
      <div className="container-custom">
        <div className="max-w-3xl mb-32">
          <h2 className="text-brand-accent font-bold text-[10px] tracking-[0.4em] mb-8 uppercase">EXPERTISE</h2>
          <h3 className="text-4xl md:text-6xl font-bold text-brand-dark mb-10 tracking-tighter">JS&amp;PARTNERS의 서비스</h3>
          <p className="text-gray-500 font-light text-xl leading-relaxed">
            우리는 기획의 본질을 탐구하고, 현장의 디테일을 완성합니다. 각 프로젝트의 성격에 최적화된 전문
            솔루션을 경험하십시오.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {services.map((service, idx) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-16 card-hover group"
            >
              <div className="w-12 h-12 bg-brand-gray-light flex items-center justify-center text-brand-navy mb-12 group-hover:bg-brand-accent group-hover:text-white transition-all duration-700">
                {service.icon}
              </div>
              <h4 className="text-2xl font-bold text-brand-dark mb-8 tracking-tight">{service.title}</h4>
              <p className="text-gray-500 text-sm leading-relaxed font-light">{service.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Portfolio = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredProjects = useMemo(() => {
    const nextProjects =
      activeCategory === 'all'
        ? portfolioProjects
        : portfolioProjects.filter((project) => project.filterKey === activeCategory);

    return nextProjects.slice(0, 9);
  }, [activeCategory]);

  return (
    <section id="portfolio" className="section-padding bg-white">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-3xl">
            <h2 className="text-brand-accent font-bold text-xs tracking-[0.3em] mb-4 uppercase">PORTFOLIO</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-brand-dark tracking-tight mb-6">
              주요 프로젝트와
              <br />
              누적 아카이브
            </h3>
            <p className="text-gray-500 text-lg font-light leading-relaxed">
              공공행사, 기업행사, 국제회의, 전시 프로젝트의 주요 실적과 전체 아카이브를 정리했습니다.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:min-w-[320px]">
            <div className="border border-brand-gray-border p-6 bg-brand-gray-light">
              <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">Projects</p>
              <p className="text-3xl font-bold text-brand-dark">{portfolioProjects.length}</p>
            </div>
            <div className="border border-brand-gray-border p-6 bg-brand-gray-light">
              <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase mb-3">Archive</p>
              <p className="text-3xl font-bold text-brand-dark">
                {earliestPortfolioYear}-{latestPortfolioYear}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-12">
          {portfolioFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setActiveCategory(filter.key)}
              className={`px-6 py-2.5 text-sm font-medium transition-all duration-300 border ${
                activeCategory === filter.key
                  ? 'bg-brand-dark text-white border-brand-dark'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-brand-accent hover:text-brand-accent'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-24">
          {filteredProjects.map((project, idx) => (
            <motion.a
              key={`${activeCategory}-${project.title}`}
              href={project.link}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group block"
            >
              <div className="relative aspect-[4/5] overflow-hidden mb-8 bg-brand-gray-light">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-brand-navy/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex items-center justify-center">
                  <div className="w-12 h-12 border border-white/30 rounded-full flex items-center justify-center text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-brand-accent uppercase mb-3 block">{project.category}</span>
              <h4 className="text-xl font-bold text-brand-dark mb-3 leading-snug group-hover:text-brand-accent transition-colors duration-500">
                {project.title}
              </h4>
              <p className="text-gray-500 text-sm leading-relaxed font-light mb-4">{project.desc}</p>
              <div className="flex flex-col gap-2 text-[11px] text-gray-400 font-medium tracking-wide uppercase">
                <span className="flex items-center gap-2">
                  <Calendar size={12} className="text-brand-accent" />
                  {project.date}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={12} className="text-brand-accent" />
                  {project.venue}
                </span>
                <span className="flex items-center gap-2">
                  <Users size={12} className="text-brand-accent" />
                  {project.participants}
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="pt-24 border-t border-brand-gray-border">
          <div className="flex flex-col justify-between items-start mb-16 gap-8">
            <div>
              <h4 className="text-brand-accent font-bold text-[10px] tracking-[0.4em] mb-4 uppercase">ARCHIVE</h4>
              <h3 className="text-2xl font-bold text-brand-dark tracking-tight mb-4">전체 프로젝트 아카이브</h3>
              <p className="text-gray-400 text-sm font-light max-w-md">주요 프로젝트명을 정리한 실적 아카이브입니다.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
            {portfolioHistory.map((item, idx) => (
              <motion.div
                key={`${item}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.02 }}
                className="flex items-start gap-4 group cursor-default"
              >
                <span className="text-[10px] font-bold text-brand-accent/30 group-hover:text-brand-accent transition-colors mt-1">
                  {(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className="text-sm text-gray-500 group-hover:text-brand-dark transition-colors leading-relaxed">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Partners = () => {
  const partners = [{ name: 'SURECOMPANY' }, { name: '(주)크리스앤파트너스' }];

  return (
    <section className="py-24 bg-brand-gray-light">
      <div className="container-custom text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-brand-accent font-bold text-[10px] tracking-[0.4em] mb-6 uppercase">PARTNERSHIP</h2>
          <h3 className="text-2xl md:text-3xl font-bold text-brand-dark mb-6 tracking-tight">업무협약 파트너</h3>
          <p className="text-gray-500 font-light leading-relaxed">
            JS&amp;PARTNERS는 다양한 파트너사와의 협력을 바탕으로 행사, 전시, 홍보마케팅 분야에서 안정적이고 유연한
            프로젝트 수행 체계를 구축하고 있습니다.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-8">
          {partners.map((partner, idx) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="px-12 py-8 bg-white border border-brand-gray-border flex items-center justify-center min-w-[240px] shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="font-bold text-brand-navy tracking-widest">{partner.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Strengths = () => {
  const strengths = [
    {
      title: 'PUBLIC SECTOR EXPERTISE',
      desc: '정부 부처 및 공공기관의 복잡한 행정 절차와 요구사항을 완벽하게 이해하고 대응합니다.',
      icon: <Award size={20} />,
    },
    {
      title: 'CREATIVE PLANNING',
      desc: '정형화된 행사를 넘어, 브랜드의 가치를 담은 창의적인 기획안을 제안합니다.',
      icon: <PenTool size={20} />,
    },
    {
      title: 'STABLE OPERATION',
      desc: '수년간의 현장 경험을 바탕으로 어떤 돌발 상황에서도 유연하고 안정적인 운영을 보장합니다.',
      icon: <CheckCircle2 size={20} />,
    },
  ];

  return (
    <section className="section-padding bg-brand-dark text-white overflow-hidden">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <h2 className="text-brand-accent font-bold text-xs tracking-[0.3em] mb-8 uppercase">WHY JS&amp;PARTNERS</h2>
            <h3 className="text-4xl md:text-6xl font-bold mb-12 tracking-tighter leading-[1.1]">
              우리가 만드는
              <br />
              <span className="text-gray-500">차별화된 가치</span>
            </h3>
            <div className="space-y-12">
              {strengths.map((strength, idx) => (
                <motion.div
                  key={strength.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex gap-8 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 border border-white/10 flex items-center justify-center text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-all duration-500">
                    {strength.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-3 tracking-tight">
                      {strength.title === 'PUBLIC SECTOR EXPERTISE'
                        ? '공공 프로젝트 최적화'
                        : strength.title === 'CREATIVE PLANNING'
                          ? '창의적 기획력'
                          : '안정적인 실행력'}
                    </h4>
                    <p className="text-gray-500 text-sm leading-relaxed font-light max-w-md">{strength.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative hidden lg:block"
          >
            <div className="aspect-square bg-brand-gray-light/5 border border-white/5 p-12">
              <div className="w-full h-full border border-white/10 flex items-center justify-center relative">
                <div className="text-center">
                  <p className="text-8xl font-bold text-white/10 mb-4">JS</p>
                  <p className="text-[10px] tracking-[0.5em] text-brand-accent font-bold uppercase">Excellence</p>
                </div>
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-brand-accent" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-brand-accent" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-brand-accent" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-brand-accent" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const ContactCTA = () => {
  return (
    <section className="py-32 bg-brand-accent overflow-hidden relative">
      <div className="container-custom relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter leading-tight">
              귀하의 행사를
              <br />
              가장 빛나는 순간으로
            </h2>
            <p className="text-white/80 text-lg font-light">
              지금 JS&amp;PARTNERS와 함께 성공적인 프로젝트를 시작하십시오. 전문 기획자가 귀하의 비전을 현실로
              만들어 드립니다.
            </p>
          </div>
          <a
            href="#contact"
            className="bg-white text-brand-dark px-12 py-6 font-bold tracking-[0.2em] text-xs hover:bg-brand-dark hover:text-white transition-all duration-500 shadow-2xl"
          >
            START A PROJECT
          </a>
        </div>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-bold text-white/5 whitespace-nowrap pointer-events-none select-none">
        JS&amp;PARTNERS
      </div>
    </section>
  );
};

const Contact = () => {
  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-24">
          <div>
            <h2 className="text-brand-accent font-bold text-xs tracking-[0.3em] mb-6 uppercase">CONTACT US</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-brand-dark mb-10 tracking-tight">프로젝트 문의</h3>
            <p className="text-gray-500 mb-16 leading-relaxed font-light text-lg max-w-md">
              행사 기획, 운영, 전시 등 모든 프로젝트에 대한 문의를 환영합니다. 담당자가 확인 후 24시간 이내에
              연락드리겠습니다.
            </p>

            <div className="space-y-10">
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 border border-brand-gray-border flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Phone</p>
                  <p className="text-lg font-bold text-brand-dark">010-2967-5711</p>
                </div>
              </div>
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 border border-brand-gray-border flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Email</p>
                  <p className="text-lg font-bold text-brand-dark">jsnp@jsnpartners.org</p>
                </div>
              </div>
              <div className="flex items-start gap-6 group">
                <div className="w-12 h-12 border border-brand-gray-border flex items-center justify-center text-brand-navy group-hover:bg-brand-navy group-hover:text-white transition-all duration-500">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">Location</p>
                  <p className="text-lg font-bold text-brand-dark">강원특별자치도 원주시 무실동 643-7(만대로 200-22, 블루타워) 207호</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-brand-navy p-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl" />
            <h4 className="text-2xl font-bold mb-10 tracking-tight relative z-10">상담 신청</h4>
            <form className="space-y-10 relative z-10" onSubmit={(e) => e.preventDefault()}>
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Name</label>
                  <input
                    type="text"
                    placeholder="성함 또는 기관명"
                    className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-brand-accent transition-colors text-sm text-white placeholder:text-gray-600"
                    required
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Email</label>
                  <input
                    type="email"
                    placeholder="이메일 주소"
                    className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-brand-accent transition-colors text-sm text-white placeholder:text-gray-600"
                    required
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Subject</label>
                <select className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-brand-accent transition-colors text-sm text-white appearance-none cursor-pointer">
                  <option className="bg-brand-navy text-white">행사 기획 및 운영 문의</option>
                  <option className="bg-brand-navy text-white">전시 및 박람회 문의</option>
                  <option className="bg-brand-navy text-white">기타 비즈니스 문의</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Message</label>
                <textarea
                  rows={4}
                  placeholder="프로젝트의 성격, 일정, 예산 등 상세 내용을 남겨주세요."
                  className="w-full bg-transparent border-b border-white/10 py-4 focus:outline-none focus:border-brand-accent transition-colors text-sm text-white placeholder:text-gray-600 resize-none"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full btn-primary !bg-brand-accent !text-white hover:!bg-white hover:!text-brand-navy mt-8 !py-6"
              >
                SEND MESSAGE
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-brand-dark text-white pt-32 pb-12 border-t border-white/5">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 flex items-center justify-center">
                <img src={resolveAssetPath('/logo.png')} alt="JS&PARTNERS Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-lg tracking-[0.2em]">JS&amp;PARTNERS</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 font-light">
              기획의 본질에 집중하여 완성도 높은 행사 경험을 만드는 프리미엄 파트너. JS&amp;PARTNERS는 귀하의 소중한
              비전을 가장 빛나는 현실로 만듭니다.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-8 uppercase">Navigation</h4>
            <ul className="space-y-4 text-xs text-gray-500 font-medium">
              <li>
                <a href="#about" className="hover:text-brand-accent transition-colors">
                  ABOUT
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-brand-accent transition-colors">
                  SERVICES
                </a>
              </li>
              <li>
                <a href="#portfolio" className="hover:text-brand-accent transition-colors">
                  PORTFOLIO
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-brand-accent transition-colors">
                  CONTACT
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-8 uppercase">Expertise</h4>
            <ul className="space-y-4 text-xs text-gray-500 font-medium">
              <li>GOVERNMENT FORUM</li>
              <li>CORPORATE CONFERENCE</li>
              <li>EXHIBITION &amp; FAIR</li>
              <li>CULTURAL FESTIVAL</li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-8 uppercase">Office</h4>
            <ul className="space-y-4 text-xs text-gray-500 font-medium">
              <li className="flex items-center gap-2">
                <Phone size={12} className="text-brand-accent" /> 010-2967-5711
              </li>
              <li className="flex items-center gap-2">
                <Mail size={12} className="text-brand-accent" /> jsnp@jsnpartners.org
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={12} className="text-brand-accent" /> 강원특별자치도 원주시 무실동 643-7(만대로 200-22, 블루타워) 207호
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-gray-600 tracking-widest uppercase font-bold">
          <p>© 2026 JS&amp;PARTNERS. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-10">
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <div className="font-sans">
      <Header />
      <main>
        <Hero />
        <About />
        <Stats />
        <Process />
        <Services />
        <Portfolio />
        <Partners />
        <Strengths />
        <ContactCTA />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
