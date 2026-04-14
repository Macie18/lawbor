/**
 * 合同审查页面 - 自动提取企业风险版
 *
 * 功能：
 * 1. 上传合同文件或输入文本
 * 2. Dify 智能审查合同风险
 * 3. 自动从合同提取企业名称并查询风险
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileText,
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
  Building2,
  History,
  Trash2,
  Eye,
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import { useAuth } from '../contexts/AuthContext';
import { useContractReviews } from '../hooks/useContractReviews';
import { runContractReview } from '../services/contractReviewService';
import { extractTextFromFile } from '../utils/fileParser';
import { extractCompanyNameFromContract, queryCompanyRisk } from '../services/qccService';
import RiskCard from '../components/RiskCard';
import type { ContractReviewResult, RiskLevel, WorkflowProgress } from '../types/contractReview';
import type { CompanyRiskReport } from '../services/qccService';
import CompanyRiskDisplay from '../components/CompanyRiskDisplay';

type FilterOption = 'all' | RiskLevel;

const STEP_COLORS: Record<string, string> = {
  idle: 'bg-slate-200',
  extracting: 'bg-blue-500',
  retrieving: 'bg-purple-500',
  reviewing: 'bg-amber-500',
  completed: 'bg-green-500',
  error: 'bg-red-500',
};

const FILTER_OPTIONS: { key: FilterOption; label: { zh: string; en: string }; color: string }[] = [
  { key: 'all', label: { zh: '全部', en: 'All' }, color: 'bg-slate-600 hover:bg-slate-700' },
  { key: 'high', label: { zh: '高危', en: 'High' }, color: 'bg-red-500 hover:bg-red-600' },
  { key: 'medium', label: { zh: '中危', en: 'Medium' }, color: 'bg-amber-500 hover:bg-amber-600' },
  { key: 'low', label: { zh: '低危', en: 'Low' }, color: 'bg-blue-500 hover:bg-blue-600' },
];

export default function ContractCheckPage() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { reviews, saveReview, deleteReview } = useContractReviews();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContractReviewResult | null>(null);
  const [progress, setProgress] = useState<WorkflowProgress>({ step: 'idle', message: '', progress: 0 });
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [streamingText, setStreamingText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
  const [textInput, setTextInput] = useState('');

  // 企业风险相关状态
  const [detectedCompanyName, setDetectedCompanyName] = useState<string>('');
  const [companyRiskReport, setCompanyRiskReport] = useState<CompanyRiskReport | null>(null);
  const [companyRiskLoading, setCompanyRiskLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setResult(null);
    setActiveFilter('all');
    setStreamingText('');
    setParseError(null);
    setTextInput('');
    setDetectedCompanyName('');
    setCompanyRiskReport(null);

    try {
      // Step 1: 解析文件
      setProgress({ step: 'extracting', message: '正在解析文件...', progress: 5 });

      const fileText = await extractTextFromFile(selectedFile);
      console.log('[ContractCheck] 文件解析成功, 文本长度:', fileText.length);

      // Step 2: 提取企业名称
      const companyName = extractCompanyNameFromContract(fileText);
      if (companyName) {
        console.log('[ContractCheck] 检测到公司名称:', companyName);
        setDetectedCompanyName(companyName);

        // 并行查询企业风险
        setCompanyRiskLoading(true);
        queryCompanyRisk(companyName)
          .then(report => {
            setCompanyRiskReport(report);
            console.log('[ContractCheck] 企业风险查询成功:', report.riskSummary);
          })
          .catch(err => {
            console.error('[ContractCheck] 企业风险查询失败:', err);
          })
          .finally(() => {
            setCompanyRiskLoading(false);
          });
      }

      // Step 3: 合同审查
      await runContractReview(
        fileText,
        (p) => setProgress(p),
        (text) => setStreamingText(text)
      ).then(async (reviewResult) => {
        setResult(reviewResult);

        // 保存审查记录（仅登录用户）
        if (user && reviewResult) {
          const defaultName = `合同审查_${new Date().toLocaleDateString('zh-CN')}_${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
          await saveReview(defaultName, '合同', JSON.stringify(reviewResult));
        }
      });

    } catch (error) {
      console.error('Contract Check Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      let userMessage = errorMessage;
      if (errorMessage.includes('扫描版')) {
        userMessage = '该文件为扫描版图片，无法提取文字';
      } else if (errorMessage.includes('解析失败')) {
        userMessage = '文件解析失败，请确保是文字版 PDF 或 Word';
      }

      setParseError(userMessage);
      setProgress({ step: 'error', message: userMessage, progress: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalyze = async () => {
    if (!textInput.trim()) return;

    setLoading(true);
    setResult(null);
    setParseError(null);
    setFile(null);
    setDetectedCompanyName('');
    setCompanyRiskReport(null);

    try {
      setProgress({ step: 'extracting', message: '正在分析文本...', progress: 10 });

      // 提取企业名称
      const companyName = extractCompanyNameFromContract(textInput);
      if (companyName) {
        setDetectedCompanyName(companyName);
        setCompanyRiskLoading(true);
        queryCompanyRisk(companyName)
          .then(report => setCompanyRiskReport(report))
          .catch(err => console.error('[ContractCheck] 企业风险查询失败:', err))
          .finally(() => setCompanyRiskLoading(false));
      }

      await runContractReview(
        textInput,
        (p) => setProgress(p),
        (text) => setStreamingText(text)
      ).then(async (reviewResult) => {
        setResult(reviewResult);

        if (user && reviewResult) {
          const defaultName = `合同审查_${new Date().toLocaleDateString('zh-CN')}_${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
          await saveReview(defaultName, '合同', JSON.stringify(reviewResult));
        }
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setParseError(errorMessage);
      setProgress({ step: 'error', message: errorMessage, progress: 0 });
    } finally {
      setLoading(false);
    }
  };

  // 过滤风险
  const filteredRisks = result?.riskAssessments
    ? (activeFilter === 'all'
        ? result.riskAssessments
        : result.riskAssessments.filter(r => r.level === activeFilter))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/contract-review')}
          className="flex items-center gap-2 mb-6 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">
            {language === 'zh' ? '返回选择' : 'Back'}
          </span>
        </motion.button>

        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <Shield className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              {language === 'zh' ? '我要验牌-合同审查' : 'Contract Review'}
            </h1>
          </div>
          <p className="text-slate-600">
            {language === 'zh'
              ? '上传劳动合同，智能审查风险条款'
              : 'Upload labor contract, intelligently review risky clauses'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧：企业风险提示 */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-violet-600" />
                <h3 className="font-bold text-slate-900">
                  {language === 'zh' ? '企业风险提示' : 'Company Risk Alert'}
                </h3>
              </div>

              {companyRiskLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{language === 'zh' ? '正在查询企业风险...' : 'Querying company risk...'}</span>
                </div>
              )}

              {detectedCompanyName && !companyRiskLoading && !companyRiskReport && (
                <div className="text-sm text-slate-500">
                  {language === 'zh' ? `检测到企业：${detectedCompanyName}` : `Detected company: ${detectedCompanyName}`}
                </div>
              )}

              {companyRiskReport && (
                <CompanyRiskDisplay report={companyRiskReport} />
              )}

              {!detectedCompanyName && !companyRiskLoading && !companyRiskReport && (
                <div className="text-sm text-slate-400 text-center py-8">
                  {language === 'zh'
                    ? '上传合同后，系统将自动提取企业名称并查询风险'
                    : 'After uploading contract, system will auto-detect company name and query risks'}
                </div>
              )}
            </motion.div>
          </div>

          {/* 右侧：合同审查 */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
            >
              {/* 输入模式切换 */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setInputMode('file')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    inputMode === 'file'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="h-4 w-4 inline mr-2" />
                  {language === 'zh' ? '上传文件' : 'Upload File'}
                </button>
                <button
                  onClick={() => setInputMode('text')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    inputMode === 'text'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="h-4 w-4 inline mr-2" />
                  {language === 'zh' ? '输入文本' : 'Input Text'}
                </button>
              </div>

              {/* 文件上传 */}
              {inputMode === 'file' && (
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={loading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-1">
                      {language === 'zh' ? '点击或拖拽上传合同文件' : 'Click or drag to upload contract'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {language === 'zh' ? '支持 PDF、Word、文本格式' : 'PDF, Word, Text supported'}
                    </p>
                  </label>
                </div>
              )}

              {/* 文本输入 */}
              {inputMode === 'text' && (
                <div>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={language === 'zh' ? '粘贴合同文本内容...' : 'Paste contract text here...'}
                    className="w-full h-48 px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:border-blue-500 focus:outline-none"
                    disabled={loading}
                  />
                  <button
                    onClick={handleTextAnalyze}
                    disabled={loading || !textInput.trim()}
                    className="w-full mt-3 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        {language === 'zh' ? '分析中...' : 'Analyzing...'}
                      </>
                    ) : (
                      language === 'zh' ? '开始分析' : 'Start Analysis'
                    )}
                  </button>
                </div>
              )}

              {/* 进度显示 */}
              {loading && progress.step !== 'idle' && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{progress.message}</span>
                    <span className="text-slate-400">{progress.progress}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${STEP_COLORS[progress.step]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* 错误提示 */}
              {parseError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {parseError}
                </div>
              )}
            </motion.div>

            {/* 审查结果 */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
              >
                {/* 结果头部 */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-3">
                    {language === 'zh' ? '审查结果' : 'Review Result'}
                  </h3>

                  {/* 过滤按钮（显示条数） */}
                  <div className="flex gap-2 flex-wrap">
                    {/* 全部 */}
                    <button
                      onClick={() => setActiveFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeFilter === 'all'
                          ? 'bg-slate-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {language === 'zh' ? `全部 ${result.riskAssessments.length}条` : `All ${result.riskAssessments.length}`}
                    </button>

                    {/* 高危 */}
                    <button
                      onClick={() => setActiveFilter('high')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeFilter === 'high'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      {language === 'zh'
                        ? `高危 ${result.riskAssessments.filter(r => r.level === 'high').length}条`
                        : `High ${result.riskAssessments.filter(r => r.level === 'high').length}`}
                    </button>

                    {/* 中危 */}
                    <button
                      onClick={() => setActiveFilter('medium')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeFilter === 'medium'
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      }`}
                    >
                      {language === 'zh'
                        ? `中危 ${result.riskAssessments.filter(r => r.level === 'medium').length}条`
                        : `Medium ${result.riskAssessments.filter(r => r.level === 'medium').length}`}
                    </button>

                    {/* 低危 */}
                    <button
                      onClick={() => setActiveFilter('low')}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        activeFilter === 'low'
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      {language === 'zh'
                        ? `低危 ${result.riskAssessments.filter(r => r.level === 'low').length}条`
                        : `Low ${result.riskAssessments.filter(r => r.level === 'low').length}`}
                    </button>
                  </div>
                </div>

                {/* 风险卡片 */}
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredRisks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      {language === 'zh' ? '暂无风险项' : 'No risks found'}
                    </div>
                  ) : (
                    filteredRisks.map((risk, index) => (
                      <RiskCard key={index} risk={risk} index={index} />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* 历史审查记录（仅登录用户显示） */}
        {user && reviews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-slate-900">
              <History className="h-6 w-6 text-violet-600" />
              {language === 'zh' ? '历史审查记录' : 'Review History'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reviews.map(review => {
                // 解析审查结果
                let resultData: ContractReviewResult | null = null;
                try {
                  resultData = JSON.parse(review.review_result);
                } catch { /* 忽略解析错误 */ }

                return (
                  <div
                    key={review.id}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-shadow cursor-pointer group"
                    onClick={() => {
                      // 点击后显示详情
                      setResult(resultData);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {review.contract_name}
                        </p>
                        <p className="text-xs text-slate-500">{review.contract_type}</p>

                        {resultData && (
                          <div className="mt-3 space-y-1">
                            {/* 风险统计 */}
                            <div className="flex gap-2 flex-wrap">
                              <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">
                                {language === 'zh' ? '高危' : 'High'} {resultData.riskAssessments?.filter(r => r.level === 'high').length || 0}
                              </span>
                              <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded">
                                {language === 'zh' ? '中危' : 'Medium'} {resultData.riskAssessments?.filter(r => r.level === 'medium').length || 0}
                              </span>
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded">
                                {language === 'zh' ? '低危' : 'Low'} {resultData.riskAssessments?.filter(r => r.level === 'low').length || 0}
                              </span>
                            </div>

                            {/* 摘要 */}
                            <p className="text-sm text-slate-600 mt-2 line-clamp-2">
                              {resultData.summary}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止冒泡，避免触发卡片点击
                          deleteReview(review.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                        title={language === 'zh' ? '删除记录' : 'Delete'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 查看详情提示 */}
                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="h-3 w-3" />
                      {language === 'zh' ? '点击查看详情' : 'Click to view details'}
                    </div>

                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(review.created_at).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}