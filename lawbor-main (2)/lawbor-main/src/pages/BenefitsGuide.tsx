import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShieldCheck, Umbrella, Home, Baby, Info, ChevronDown, MapPin, Globe, Sparkles, Loader2, AlertCircle, ArrowUp, Briefcase } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, Spin } from 'antd';
import { useTranslation } from '../contexts/TranslationContext';
import styles from './BenefitsGuide.module.css';

const { Option } = Select;

interface TocItem {
  id: string;
  text: string;
  level: number;
}

// ✅ 新增：政策类型常量
const POLICY_TYPES = [
  { id: 'social', name: '五险一金', nameEn: 'Social Insurance' },
  { id: 'employment', name: '就业扶持', nameEn: 'Employment Support' },
];

const CITIES = [
  { id: 'beijing', name: '北京', nameEn: 'Beijing' },
  { id: 'shanghai', name: '上海', nameEn: 'Shanghai' },
  { id: 'tianjin', name: '天津', nameEn: 'Tianjin' },
  { id: 'chongqing', name: '重庆', nameEn: 'Chongqing' },
];

const benefits = [
  {
    id: 'pension',
    title: '养老保险',
    titleEn: 'Pension Insurance',
    description: '为年老丧失劳动能力后的基本生活提供保障。',
    descriptionEn: 'Provides basic living security after aging and losing labor capacity.',
    icon: ShieldCheck,
    color: 'bg-blue-500',
    details: [
      '缴纳比例：个人8%，单位16%（各地区略有差异）',
      '领取条件：累计缴费满15年，达到法定退休年龄',
      '待遇：基础养老金 + 个人账户养老金',
    ],
    detailsEn: [
      'Contribution: individual 8%, employer 16% (varies by region)',
      'Eligibility: 15+ years cumulative contribution, reaching retirement age',
      'Benefits: Basic pension + personal account pension',
    ],
  },
  {
    id: 'medical',
    title: '医疗保险',
    titleEn: 'Medical Insurance',
    description: '补偿劳动者因疾病风险造成的经济损失。',
    descriptionEn: 'Compensates workers for economic losses due to illness.',
    icon: Heart,
    color: 'bg-rose-500',
    details: [
      '缴纳比例：个人2%，单位8%-10%',
      '待遇：门诊报销、住院报销、大病互助',
      '个人账户：可用于药店买单或门诊支付',
    ],
    detailsEn: [
      'Contribution: individual 2%, employer 8%-10%',
      'Benefits: outpatient & hospitalization reimbursement, serious illness aid',
      'Personal account: usable at pharmacies or for outpatient payments',
    ],
  },
  {
    id: 'housing',
    title: '住房公积金',
    titleEn: 'Housing Provident Fund',
    description: '长期住房储金，用于购房、租房等。',
    descriptionEn: 'Long-term housing savings for buying or renting property.',
    icon: Home,
    color: 'bg-emerald-500',
    details: [
      '缴纳比例：个人5%-12%，单位同比例对冲',
      '用途：公积金贷款（利率低）、租房提取、购房提取',
      '优势：免税、单位等额补贴',
    ],
    detailsEn: [
      'Contribution: individual 5%-12%, employer matches same rate',
      'Uses: low-interest housing loan, rent withdrawal, home purchase',
      'Advantage: tax-free, employer matched contribution',
    ],
  },
  {
    id: 'unemployment',
    title: '失业保险',
    titleEn: 'Unemployment Insurance',
    description: '为失业人员提供基本生活保障。',
    descriptionEn: 'Provides basic living security for unemployed persons.',
    icon: Umbrella,
    color: 'bg-amber-500',
    details: [
      '缴纳比例：个人0.5%，单位0.5%-1%',
      '领取条件：非因本人意愿中断就业，缴费满1年',
      '待遇：失业保险金、医疗补助金',
    ],
    detailsEn: [
      'Contribution: individual 0.5%, employer 0.5%-1%',
      'Eligibility: involuntary unemployment, 1+ year contribution',
      'Benefits: unemployment insurance payment, medical subsidy',
    ],
  },
  {
    id: 'maternity',
    title: '生育保险',
    titleEn: 'Maternity Insurance',
    description: '保障女性劳动者生育期间的医疗和生活。',
    descriptionEn: 'Covers medical care and living expenses during childbirth.',
    icon: Baby,
    color: 'bg-pink-500',
    details: [
      '缴纳比例：个人不缴费，单位缴费',
      '待遇：生育医疗费报销、生育津贴（产假工资）',
      '领取条件：用人单位缴费满一定期限',
    ],
    detailsEn: [
      'Contribution: individual pays nothing, employer pays',
      'Benefits: maternity medical reimbursement, maternity allowance',
      'Eligibility: employer contribution for a certain period',
    ],
  },
  {
    id: 'injury',
    title: '工伤保险',
    titleEn: 'Work-related Injury Insurance',
    description: '保障因工作遭受事故伤害或患职业病的劳动者。',
    descriptionEn: 'Protects workers injured in work accidents or from occupational diseases.',
    icon: ShieldCheck,
    color: 'bg-indigo-500',
    details: [
      '缴纳比例：个人不缴费，单位根据行业风险缴费',
      '待遇：医疗费、伤残补助金、工亡补助金',
      '认定：工作时间、工作场所、因工作原因',
    ],
    detailsEn: [
      'Contribution: individual pays nothing, employer pays by industry risk',
      'Benefits: medical expenses, disability subsidy, death subsidy',
      'Criteria: during work hours, at workplace, work-related cause',
    ],
  },
];

/** 从 markdown 中提取 h2/h3 标题生成 TOC */
function extractToc(markdown: string): TocItem[] {
  const toc: TocItem[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    const h3 = line.match(/^### (.+)/);
    if (h2) {
      const text = h2[1].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
      toc.push({ id, text, level: 2 });
    } else if (h3) {
      const text = h3[1].trim();
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
      toc.push({ id, text, level: 3 });
    }
  }
  return toc;
}

export default function BenefitsGuide() {
  const { t, language } = useTranslation();
  const isEn = language === 'en';

  // ✅ 新增：政策类型状态
  const [policyType, setPolicyType] = useState<'social' | 'employment'>('social');
  const [expandedId, setExpandedId] = useState<string | null>('pension');
  const [selectedCity, setSelectedCity] = useState<string | null>('beijing');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCity && !selectedCity.startsWith('placeholder_')) {
      fetchMarkdown(selectedCity, language, policyType);
    } else {
      setMarkdownContent('');
      setToc([]);
      setError(null);
    }
  }, [selectedCity, language, policyType]);

  // Scroll spy for TOC active state
  useEffect(() => {
    if (toc.length === 0 || !contentRef.current) return;
    const headings = contentRef.current.querySelectorAll('h2[id], h3[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: '-20% 0% -70% 0%' }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  // Show/hide back to top button - 监听窗口和文档滚动
  useEffect(() => {
    const handleScroll = () => {
      // 多种方式检测滚动位置
      const windowScrolled = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const shouldShow = windowScrolled > 150;
      console.log('[BenefitsGuide] Scroll position:', windowScrolled, 'Show button:', shouldShow);
      setShowBackToTop(shouldShow);
    };

    // 初始检查
    handleScroll();

    // 同时监听 window 和 document 的滚动
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 改进的回到顶部函数 - 同时处理窗口和容器滚动
  const scrollToTop = () => {
    // 滚动窗口到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 如果有内容容器，也滚动它到顶部
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const fetchMarkdown = async (cityId: string, lang: 'zh' | 'en', type: 'social' | 'employment') => {
    setLoading(true);
    setError(null);
    setToc([]);
    try {
      const fileName = lang === 'en' ? `${cityId}-en.md` : `${cityId}.md`;
      // ✅ 根据政策类型选择不同目录
      const basePath = type === 'employment' ? '/policies/employment/' : '/policies/';
      const response = await fetch(`${basePath}${fileName}?t=${Date.now()}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(lang === 'en' ? 'English policy not yet available for this city' : '该地区政策文件尚未上线');
        }
        throw new Error('加载政策文件失败');
      }
      const text = await response.text();
      setMarkdownContent(text);
      // Extract TOC after render
      setTimeout(() => {
        if (contentRef.current) {
          const headings = contentRef.current.querySelectorAll('h2[id], h3[id]');
          const items: TocItem[] = [];
          headings.forEach((h) => {
            const text = h.textContent || '';
            // 过滤掉过长的标题(超过80字符的通常是段落而非标题)
            if (text.length <= 80) {
              items.push({ id: h.id, text, level: h.tagName === 'H2' ? 2 : 3 });
            }
          });
          setToc(items);
          if (items.length > 0) setActiveId(items[0].id);
        }
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setMarkdownContent('');
    } finally {
      setLoading(false);
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      // 计算 header 高度偏移(约80px) + 额外间距
      const headerOffset = 100;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveId(id);
    }
  };

  const getCityName = (id: string | null) => {
    if (!id) return '';
    const city = CITIES.find(c => c.id === id);
    return city ? (isEn ? city.nameEn : city.name) : id;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-12">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">
            {isEn ? 'Benefits Policy Guide' : '政策福利指南'}
          </h2>
        </div>
        <p className="text-lg text-slate-500">
          {isEn
            ? 'Deeply understand social insurance and workplace benefits to protect your legal rights'
            : '深入了解五险一金及各项职场福利，保障您的合法权益'}
        </p>
      </header>

      {/* Policy Type Selection Bar - 新增 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <Briefcase className="h-4 w-4" />
          <span>{isEn ? 'Policy Type:' : '政策类型：'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {POLICY_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setPolicyType(type.id as 'social' | 'employment');
                // 切换政策类型时重置城市选择
                setSelectedCity(type.id === 'employment' ? 'beijing' : null);
              }}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${
                policyType === type.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-100'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {type.id === 'social' ? (
                <Heart className="h-4 w-4" />
              ) : (
                <Briefcase className="h-4 w-4" />
              )}
              {isEn ? type.nameEn : type.name}
            </button>
          ))}
        </div>
      </div>

      {/* City Selection Bar */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <MapPin className="h-4 w-4" />
          <span>{isEn ? 'City-specific policy:' : '地区专项政策：'}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* ✅ 就业扶持政策必须选择城市，不显示"全国通用"按钮 */}
          {policyType === 'social' && (
            <button
              onClick={() => setSelectedCity(null)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${
                selectedCity === null
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Globe className="h-4 w-4" />
              {isEn ? 'National General' : '全国通用'}
            </button>
          )}

          <Select
            placeholder={isEn ? 'Select city' : '选择城市'}
            style={{ width: 200 }}
            size="large"
            className="benefits-city-select"
            onChange={(value) => setSelectedCity(value)}
            value={selectedCity}
          >
            {CITIES.map((city) => (
              <Option key={city.id} value={city.id}>
                {isEn ? city.nameEn : `${city.name}市`}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ✅ 就业扶持政策：直接显示城市政策内容 */}
        {policyType === 'employment' ? (
          // 就业扶持政策内容区域
          <motion.div
            key="employment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* 就业扶持政策提示 */}
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-violet-50 p-4 text-sm text-violet-800">
              <Briefcase className="h-5 w-5 shrink-0" />
              <p>{isEn 
                ? 'Employment support policies include: talent subsidies, entrepreneurship support, housing subsidies, social security subsidies, etc. Please select a city to view local policies.'
                : '就业扶持政策包括：人才补贴、创业扶持、安居租房补贴、社保补贴等。请选择城市查看当地政策。'}
              </p>
            </div>

            {/* 就业扶持政策内容 - 与五险一金相同的布局 */}
            {selectedCity && (
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Sticky TOC sidebar */}
                {toc.length > 0 && (
                  <div className="hidden lg:block lg:w-56 flex-shrink-0">
                    <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-violet-200 bg-white p-4 shadow-sm">
                      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                        <Sparkles className="h-3 w-3" />
                        {isEn ? 'Contents' : '目录索引'}
                      </p>
                      <ul className="space-y-1">
                        {toc.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => scrollTo(item.id)}
                              className={`block w-full text-left text-sm leading-snug transition-colors ${
                                item.level === 3 ? 'pl-4' : ''
                              } py-1 ${
                                activeId === item.id
                                  ? 'font-semibold text-violet-600'
                                  : 'text-slate-500 hover:text-violet-600'
                              }`}
                            >
                              {item.text}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Main content */}
                <motion.div
                  key={selectedCity}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 min-w-0 rounded-[2.5rem] border border-violet-200 bg-white p-8 shadow-xl lg:p-12"
                >
                  <div className="mb-8 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-100">
                      <Briefcase className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black text-slate-900">
                        {isEn ? `${getCityName(selectedCity)} Employment Support` : `${getCityName(selectedCity)}就业扶持政策`}
                      </h3>
                      <p className="text-slate-500">
                        {isEn
                          ? 'Employment and entrepreneurship support policies for graduates'
                          : '高校毕业生就业创业扶持政策'}
                      </p>
                    </div>
                  </div>

                  <div className={styles.markdownBody} ref={contentRef}>
                    {loading ? (
                      <div className={styles.loadingContainer}>
                        <Spin indicator={<Loader2 className="h-8 w-8 animate-spin" />} />
                        <p className="mt-4">{isEn ? 'Loading policy file...' : '正在加载政策文件...'}</p>
                      </div>
                    ) : error ? (
                      <div className={styles.errorContainer}>
                        <AlertCircle className="mb-4 h-12 w-12" />
                        <h4 className="text-xl font-bold">{error}</h4>
                        <p className="mt-2">{isEn ? 'Try selecting another city or try again later.' : '请尝试选择其他城市或稍后再试'}</p>
                      </div>
                    ) : markdownContent ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h2: ({ children }) => {
                            const id = String(children).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
                            return <h2 id={id}>{children}</h2>;
                          },
                          h3: ({ children }) => {
                            const id = String(children).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
                            return <h3 id={id}>{children}</h3>;
                          },
                        }}
                      >
                        {markdownContent}
                      </ReactMarkdown>
                    ) : (
                      <div className={styles.emptyContainer}>
                        <Briefcase className="mb-4 h-12 w-12 opacity-20" />
                        <h4 className="text-xl font-bold">{isEn ? 'No content yet' : '暂无政策内容'}</h4>
                      </div>
                    )}
                  </div>

                  <div className="mt-12 flex items-center gap-4 rounded-3xl bg-violet-50 p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
                      <Info className="h-6 w-6" />
                    </div>
                    <div className="text-sm text-slate-600">
                      <p className="font-bold text-slate-900">{isEn ? 'Data updated in April 2026' : '数据更新于 2026 年 4 月'}</p>
                      <p>{isEn
                        ? 'The above information is compiled by the Lawbor team based on official public information for reference only. For specific business handling, please consult local 12333 or relevant departments.'
                        : '以上信息由 Lawbor 团队根据官方公示信息整理，仅供参考。具体业务办理请咨询当地 12333 或相关部门。'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : selectedCity === null ? (
          <motion.div
            key="national"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {benefits.map((benefit) => (
              <motion.div
                key={benefit.id}
                layout
                className={`flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50 ${
                  expandedId === benefit.id ? 'lg:col-span-2 lg:row-span-2' : ''
                }`}
              >
                <div className="p-8">
                  <div className="mb-6 flex items-center justify-between">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${benefit.color} text-white shadow-lg`}>
                      <benefit.icon className="h-7 w-7" />
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === benefit.id ? null : benefit.id)}
                      className="rounded-full p-2 hover:bg-slate-100"
                    >
                      <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${expandedId === benefit.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  <h3 className="mb-3 text-xl font-bold text-slate-900">{isEn ? benefit.titleEn : benefit.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-500">
                    {isEn ? benefit.descriptionEn : benefit.description}
                  </p>

                  {expandedId === benefit.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 space-y-4 border-t pt-6"
                    >
                      <h4 className="font-bold text-slate-900">{isEn ? 'Key Policy Points' : '核心政策要点'}</h4>
                      <ul className="space-y-3">
                        {(isEn ? benefit.detailsEn : benefit.details).map((detail, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8 flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>{isEn
                          ? 'Please refer to the latest announcements from local social security bureau / housing fund center for specific contribution base and rates.'
                          : '具体缴纳基数和比例请以当地社保局/公积金中心最新公告为准。'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sticky TOC sidebar — desktop only */}
            {toc.length > 0 && (
              <div className="hidden lg:block lg:w-56 flex-shrink-0">
                <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Sparkles className="h-3 w-3" />
                    {isEn ? 'Contents' : '目录索引'}
                  </p>
                  <ul className="space-y-1">
                    {toc.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => scrollTo(item.id)}
                          className={`block w-full text-left text-sm leading-snug transition-colors ${
                            item.level === 3 ? 'pl-4' : ''
                          } py-1 ${
                            activeId === item.id
                              ? 'font-semibold text-blue-600'
                              : 'text-slate-500 hover:text-blue-600'
                          }`}
                        >
                          {item.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Main content */}
            <motion.div
              key={selectedCity}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 min-w-0 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl lg:p-12"
            >
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900">
                    {isEn ? `${getCityName(selectedCity)} Policy Guide` : `${getCityName(selectedCity)}市专项政策`}
                  </h3>
                  <p className="text-slate-500">
                    {isEn
                      ? 'Detailed policy guide based on the latest local regulations'
                      : '基于当地最新法规整理的详实政策指南'}
                  </p>
                </div>
              </div>

              <div className={styles.markdownBody} ref={contentRef}>
                {loading ? (
                  <div className={styles.loadingContainer}>
                    <Spin indicator={<Loader2 className="h-8 w-8 animate-spin" />} />
                    <p className="mt-4">{isEn ? 'Loading policy file...' : '正在加载政策文件...'}</p>
                  </div>
                ) : error ? (
                  <div className={styles.errorContainer}>
                    <AlertCircle className="mb-4 h-12 w-12" />
                    <h4 className="text-xl font-bold">{error}</h4>
                    <p className="mt-2">{isEn ? 'Try selecting another city or try again later.' : '请尝试选择其他城市或稍后再试'}</p>
                  </div>
                ) : markdownContent ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ children }) => {
                        const id = String(children).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
                        return <h2 id={id}>{children}</h2>;
                      },
                      h3: ({ children }) => {
                        const id = String(children).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/(^-|-$)/g, '');
                        return <h3 id={id}>{children}</h3>;
                      },
                    }}
                  >
                    {markdownContent}
                  </ReactMarkdown>
                ) : (
                  <div className={styles.emptyContainer}>
                    <Globe className="mb-4 h-12 w-12 opacity-20" />
                    <h4 className="text-xl font-bold">{isEn ? 'No content yet' : '暂无政策内容'}</h4>
                  </div>
                )}
              </div>

              <div className="mt-12 flex items-center gap-4 rounded-3xl bg-slate-50 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                  <Info className="h-6 w-6" />
                </div>
                <div className="text-sm text-slate-600">
                  <p className="font-bold text-slate-900">{isEn ? 'Data updated in April 2026' : '数据更新于 2026 年 4 月'}</p>
                  <p>{isEn
                    ? 'The above information is compiled by the Lawbor team based on official public information for reference only. For specific business handling, please consult local 12333 or relevant departments.'
                    : '以上信息由 Lawbor 团队根据官方公示信息整理，仅供参考。具体业务办理请咨询当地 12333 或相关部门。'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Back to top button - 使用 Portal 渲染到 body，放在 AI 按钮左边 */}
      {createPortal(
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToTop}
              className="fixed bottom-6 right-24 z-[9999] flex h-12 w-12 items-center justify-center rounded-full bg-slate-600 text-white shadow-lg hover:bg-slate-700 transition-colors"
              aria-label={isEn ? 'Back to top' : '回到顶部'}
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

