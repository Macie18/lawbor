import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShieldCheck, Umbrella, Home, Baby, Info, ChevronDown, MapPin, Globe, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, Spin } from 'antd';
import styles from './BenefitsGuide.module.css';

const { Option } = Select;

const CITIES = [
  { id: 'beijing', name: '北京' },
  { id: 'shanghai', name: '上海' },
  { id: 'tianjin', name: '天津' },
  { id: 'chongqing', name: '重庆' },
];

const benefits = [
  {
    id: 'pension',
    title: '养老保险',
    description: '为年老丧失劳动能力后的基本生活提供保障。',
    icon: ShieldCheck,
    color: 'bg-blue-500',
    details: [
      '缴纳比例：个人8%，单位16%（各地区略有差异）',
      '领取条件：累计缴费满15年，达到法定退休年龄',
      '待遇：基础养老金 + 个人账户养老金',
    ],
  },
  {
    id: 'medical',
    title: '医疗保险',
    description: '补偿劳动者因疾病风险造成的经济损失。',
    icon: Heart,
    color: 'bg-rose-500',
    details: [
      '缴纳比例：个人2%，单位8%-10%',
      '待遇：门诊报销、住院报销、大病互助',
      '个人账户：可用于药店买单或门诊支付',
    ],
  },
  {
    id: 'housing',
    title: '住房公积金',
    description: '长期住房储金，用于购房、租房等。',
    icon: Home,
    color: 'bg-emerald-500',
    details: [
      '缴纳比例：个人5%-12%，单位同比例对冲',
      '用途：公积金贷款（利率低）、租房提取、购房提取',
      '优势：免税、单位等额补贴',
    ],
  },
  {
    id: 'unemployment',
    title: '失业保险',
    description: '为失业人员提供基本生活保障。',
    icon: Umbrella,
    color: 'bg-amber-500',
    details: [
      '缴纳比例：个人0.5%，单位0.5%-1%',
      '领取条件：非因本人意愿中断就业，缴费满1年',
      '待遇：失业保险金、医疗补助金',
    ],
  },
  {
    id: 'maternity',
    title: '生育保险',
    description: '保障女性劳动者生育期间的医疗和生活。',
    icon: Baby,
    color: 'bg-pink-500',
    details: [
      '缴纳比例：个人不缴费，单位缴费',
      '待遇：生育医疗费报销、生育津贴（产假工资）',
      '领取条件：用人单位缴费满一定期限',
    ],
  },
  {
    id: 'injury',
    title: '工伤保险',
    description: '保障因工作遭受事故伤害或患职业病的劳动者。',
    icon: ShieldCheck,
    color: 'bg-indigo-500',
    details: [
      '缴纳比例：个人不缴费，单位根据行业风险缴费',
      '待遇：医疗费、伤残补助金、工亡补助金',
      '认定：工作时间、工作场所、因工作原因',
    ],
  },
];

export default function BenefitsGuide() {
  const [expandedId, setExpandedId] = useState<string | null>('pension');
  const [selectedCity, setSelectedCity] = useState<string | null>('beijing');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCity && !selectedCity.startsWith('placeholder_')) {
      fetchMarkdown(selectedCity);
    } else {
      setMarkdownContent('');
      setError(null);
    }
  }, [selectedCity]);

  const fetchMarkdown = async (cityId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/policies/${cityId}.md?t=${Date.now()}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('该地区政策文件尚未上线');
        }
        throw new Error('加载政策文件失败');
      }
      const text = await response.text();
      setMarkdownContent(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      setMarkdownContent('');
    } finally {
      setLoading(false);
    }
  };

  const getCityName = (id: string | null) => {
    if (!id) return '';
    const city = CITIES.find(c => c.id === id);
    return city ? city.name : id;
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-12">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
            <Heart className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">政策福利指南</h2>
        </div>
        <p className="text-lg text-slate-500">深入了解五险一金及各项职场福利，保障您的合法权益</p>
      </header>

      {/* City Selection Bar */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <MapPin className="h-4 w-4" />
          <span>地区专项政策：</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setSelectedCity(null)}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition-all ${
              selectedCity === null
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Globe className="h-4 w-4" />
            全国通用
          </button>
          
          <Select
            placeholder="选择城市"
            style={{ width: 200 }}
            size="large"
            className="benefits-city-select"
            onChange={(value) => setSelectedCity(value)}
            value={selectedCity}
          >
            {CITIES.map(city => (
              <Option key={city.id} value={city.id}>{city.name}市</Option>
            ))}
          </Select>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedCity === null ? (
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

                  <h3 className="mb-3 text-xl font-bold text-slate-900">{benefit.title}</h3>
                  <p className="mb-6 text-sm leading-relaxed text-slate-500">
                    {benefit.description}
                  </p>

                  {expandedId === benefit.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 space-y-4 border-t pt-6"
                    >
                      <h4 className="font-bold text-slate-900">核心政策要点</h4>
                      <ul className="space-y-3">
                        {benefit.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8 flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
                        <Info className="h-5 w-5 shrink-0" />
                        <p>具体缴纳基数和比例请以当地社保局/公积金中心最新公告为准。</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key={selectedCity}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl lg:p-12"
          >
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                <Sparkles className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-3xl font-black text-slate-900">{getCityName(selectedCity)}市专项政策</h3>
                <p className="text-slate-500">基于当地最新法规整理的详实政策指南</p>
              </div>
            </div>

            <div className={styles.markdownBody}>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <Spin indicator={<Loader2 className="h-8 w-8 animate-spin" />} />
                  <p className="mt-4">正在加载政策文件...</p>
                </div>
              ) : error ? (
                <div className={styles.errorContainer}>
                  <AlertCircle className="mb-4 h-12 w-12" />
                  <h4 className="text-xl font-bold">{error}</h4>
                  <p className="mt-2">请尝试选择其他城市或稍后再试</p>
                </div>
              ) : markdownContent ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdownContent}</ReactMarkdown>
              ) : (
                <div className={styles.emptyContainer}>
                  <Globe className="mb-4 h-12 w-12 opacity-20" />
                  <h4 className="text-xl font-bold">暂无政策内容</h4>
                </div>
              )}
            </div>

            <div className="mt-12 flex items-center gap-4 rounded-3xl bg-slate-50 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                <Info className="h-6 w-6" />
              </div>
              <div className="text-sm text-slate-600">
                <p className="font-bold text-slate-900">数据更新于 2026 年 4 月</p>
                <p>以上信息由 Lawbor 团队根据官方公示信息整理，仅供参考。具体业务办理请咨询当地 12333 或相关部门。</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

