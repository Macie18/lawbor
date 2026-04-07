import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Upload,
  FileText,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import { runContractReview } from '../services/contractReviewService';
import { extractTextFromFile } from '../utils/fileParser';
import RiskCard from '../components/RiskCard';
import type {
  ContractReviewResult,
  RiskLevel,
  WorkflowStep,
  WorkflowProgress,
} from '../types/contractReview';
import {
  RiskLevelMap,
  WORKFLOW_STEPS,
} from '../types/contractReview';

// 过滤选项
type FilterOption = 'all' | RiskLevel;

// 进度步骤颜色映射
const STEP_COLORS: Record<WorkflowStep, string> = {
  idle: 'bg-slate-200',
  extracting: 'bg-blue-500',
  retrieving: 'bg-purple-500',
  reviewing: 'bg-amber-500',
  completed: 'bg-green-500',
  error: 'bg-red-500',
};

// 过滤按钮配置
const FILTER_OPTIONS: { key: FilterOption; label: { zh: string; en: string }; color: string }[] = [
  { key: 'all', label: { zh: '全部', en: 'All' }, color: 'bg-slate-600 hover:bg-slate-700' },
  { key: 'high', label: { zh: '高危', en: 'High' }, color: 'bg-red-500 hover:bg-red-600' },
  { key: 'medium', label: { zh: '中危', en: 'Medium' }, color: 'bg-amber-500 hover:bg-amber-600' },
  { key: 'low', label: { zh: '低危', en: 'Low' }, color: 'bg-blue-500 hover:bg-blue-600' },
  { key: 'safe', label: { zh: '安全', en: 'Safe' }, color: 'bg-green-500 hover:bg-green-600' },
];

export default function ContractReview() {
  const { t, language } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContractReviewResult | null>(null);
  const [progress, setProgress] = useState<WorkflowProgress>({
    step: 'idle',
    message: '',
    progress: 0,
  });
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [streamingText, setStreamingText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setResult(null);
    setActiveFilter('all');
    setStreamingText('');
    setParseError(null);

    try {
      // 第一步：解析文件提取文本
      setProgress({
        step: 'extracting',
        message: '正在解析文件...',
        progress: 5,
      });

      const fileText = await extractTextFromFile(selectedFile);
      console.log('[ContractReview] 文件解析成功, 文本长度:', fileText.length);

      // 第二步：调用 Dify API 进行审查
      await runContractReview(
        fileText,
        (p) => {
          setProgress(p);
        },
        (text) => {
          setStreamingText(text);
        }
      ).then((reviewResult) => {
        setResult(reviewResult);
      });
    } catch (error) {
      console.error('Contract Review Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[ContractReview] 错误详情:', errorMessage);

      // 简短的用户友好提示
      let userMessage = errorMessage;
      if (errorMessage.includes('扫描版')) {
        userMessage = '该文件为扫描版图片，无法提取文字';
      } else if (errorMessage.includes('解析失败')) {
        userMessage = '文件解析失败，请确保是文字版 PDF 或 Word';
      }

      setParseError(userMessage);
      setProgress({
        step: 'error',
        message: userMessage,
        progress: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // 根据过滤条件筛选风险卡片
  const filteredRisks = useMemo(() => {
    if (!result) return [];
    if (activeFilter === 'all') return result.riskAssessments;
    return result.riskAssessments.filter((r) => r.level === activeFilter);
  }, [result, activeFilter]);

  // 渲染进度步骤条
  const renderProgressSteps = () => {
    const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.key === progress.step);
    const isError = progress.step === 'error';

    // RAG 虚拟步骤特殊处理：如果刚完成 extracting，开始 retrieving 后又快速进入 reviewing
    const showRetrieving = progress.step === 'retrieving' ||
      (progress.step === 'reviewing' && progress.progress < 60);

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 rounded-full" />
          <div
            className="absolute top-5 left-0 h-1 bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress.progress, 100)}%` }}
          />

          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = index < currentIndex || progress.step === 'completed';
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex && progress.step !== 'completed';

            // 跳过显示 retrieving 步骤（用于动画效果）
            if (step.key === 'retrieving' && !showRetrieving) return null;

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? `${STEP_COLORS[progress.step]} text-white animate-pulse`
                      : isError
                      ? 'bg-red-500 text-white'
                      : showRetrieving && step.key === 'reviewing'
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : isCurrent && loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : showRetrieving && step.key === 'reviewing' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    isCurrent ? 'text-blue-600 font-medium' : 'text-slate-400'
                  }`}
                >
                  {step.label[language === 'zh' ? 'zh' : 'en']}
                </span>
              </div>
            );
          })}
        </div>

        {progress.message && (
          <p className="text-center text-sm text-slate-500 mt-4">{progress.message}</p>
        )}
      </div>
    );
  };

  // 渲染流式文本预览（类似打字机效果）
  const renderStreamingPreview = () => {
    if (!streamingText) return null;

    // 尝试解析当前的 JSON 片段
    const truncated = streamingText.slice(-500); // 只显示最后500字符

    return (
      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-xs text-slate-500 mb-2">
          {language === 'zh' ? '💭 AI 正在生成风险评估...' : '💭 AI is generating risk assessment...'}
        </p>
        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
          {truncated}
        </pre>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-600">
            {language === 'zh' ? '流式输出中...' : 'Streaming...'}
          </span>
        </div>
      </div>
    );
  };

  // 渲染整体评分卡片
  const renderOverallScore = () => {
    if (!result) return null;

    const levelColor: Record<RiskLevel, string> = {
      high: 'from-red-500 to-red-600',
      medium: 'from-amber-400 to-amber-500',
      low: 'from-blue-400 to-blue-500',
      safe: 'from-green-400 to-green-500',
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br rounded-3xl p-6 text-white mb-6"
      >
        <div className={`bg-gradient-to-br ${levelColor[result.overallLevel]} rounded-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">
                {language === 'zh' ? '整体风险评估' : 'Overall Risk Assessment'}
              </p>
              <h3 className="text-2xl font-bold">
                {RiskLevelMap[result.overallLevel]}
              </h3>
              <p className="text-white/90 mt-2">{result.summary}</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold">{result.overallScore}</div>
              <div className="text-white/70 text-sm">
                {language === 'zh' ? '综合评分' : 'Score'}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // 渲染风险数量统计
  const renderStats = () => {
    if (!result) return null;

    const stats = {
      high: result.riskAssessments.filter((r) => r.level === 'high').length,
      medium: result.riskAssessments.filter((r) => r.level === 'medium').length,
      low: result.riskAssessments.filter((r) => r.level === 'low').length,
      safe: result.riskAssessments.filter((r) => r.level === 'safe').length,
    };

    return (
      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(stats).map(([level, count]) => (
          <button
            key={level}
            onClick={() => setActiveFilter(level as FilterOption)}
            className={`text-center p-3 rounded-xl transition-all ${
              activeFilter === level
                ? level === 'high'
                  ? 'bg-red-500 text-white ring-2 ring-red-300'
                  : level === 'medium'
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                  : level === 'low'
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                  : 'bg-green-500 text-white ring-2 ring-green-300'
                : level === 'high'
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : level === 'medium'
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : level === 'low'
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-xs">{RiskLevelMap[level as RiskLevel]}</div>
          </button>
        ))}
      </div>
    );
  };

  // 渲染过滤按钮栏
  const renderFilterButtons = () => {
    return (
      <div className="flex gap-2 mb-4">
        {FILTER_OPTIONS.map((option) => {
          const isActive = activeFilter === option.key;
          return (
            <button
              key={option.key}
              onClick={() => setActiveFilter(option.key)}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-all ${
                isActive ? option.color : 'bg-slate-300 text-slate-600 hover:bg-slate-400'
              }`}
            >
              {option.label[language === 'zh' ? 'zh' : 'en']}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-slate-900">{t('contract.title')}</h2>
        <p className="text-slate-500">{t('contract.desc')}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center transition-colors hover:border-blue-400">
            <input
              type="file"
              id="contract-upload"
              className="hidden"
              onChange={handleUpload}
              accept=".pdf,.doc,.docx,.jpg,.png"
            />
            <label htmlFor="contract-upload" className="cursor-pointer">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  {loading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8" />
                  )}
                </div>
              </div>
              <h3 className="mb-2 font-bold text-slate-900">{t('contract.upload')}</h3>
              <p className="text-xs text-slate-400">{t('contract.support')}</p>
            </label>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>{t('contract.warning')}</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
              <Info className="h-5 w-5 shrink-0" />
              <p>{t('contract.privacy')}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="min-h-[400px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                {renderProgressSteps()}
                {renderStreamingPreview()}
              </div>
            ) : parseError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl mb-4">
                  <AlertCircle className="h-6 w-6" />
                  <div>
                    <p className="font-medium">
                      {language === 'zh' ? '文件解析失败' : 'File Parsing Failed'}
                    </p>
                    <p className="text-sm text-red-600">{parseError}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500">
                  {language === 'zh'
                    ? '请确保文件是 PDF 或 Word 文档，且内容不是扫描图片'
                    : 'Please ensure the file is a PDF or Word document with selectable text'}
                </p>
              </div>
            ) : result ? (
              <div>
                {renderOverallScore()}
                {renderStats()}
                {renderFilterButtons()}

                <h4 className="font-bold text-slate-800 mb-4">
                  {language === 'zh'
                    ? `筛选结果: ${filteredRisks.length} 项`
                    : `Filtered: ${filteredRisks.length} items`}
                </h4>

                <div className="max-h-[500px] overflow-y-auto pr-2">
                  {filteredRisks.length > 0 ? (
                    filteredRisks.map((assessment, index) => (
                      <RiskCard key={`risk-${assessment.category}-${index}`} item={assessment} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      {language === 'zh' ? '没有符合条件的结果' : 'No matching results'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-20 text-center">
                <FileText className="mb-4 h-16 w-16 text-slate-200" />
                <h3 className="mb-2 font-bold text-slate-400">{t('contract.noResult')}</h3>
                <p className="text-sm text-slate-400">{t('contract.noResultDesc')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}