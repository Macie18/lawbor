/**
 * 简历诊所组件
 * 允许用户上传 PDF 简历，分析并生成改进建议
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from '../contexts/TranslationContext';
import { parsePDF, isPDFFile } from '../services/pdfParser';
import { analyzeResume, type ResumeAnalysis } from '../services/resumeAnalysisService';

interface ResumeClinicProps {
  onAnalysisComplete?: (analysis: ResumeAnalysis, resumeText: string) => void;
  compact?: boolean;
}

export function ResumeClinic({ onAnalysisComplete, compact = false }: ResumeClinicProps) {
  const { t, language } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!isPDFFile(file)) {
      setError(language === 'zh' ? '请上传 PDF 格式的文件' : 'Please upload a PDF file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError(language === 'zh' ? '文件大小不能超过 10MB' : 'File size cannot exceed 10MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    setFileName(file.name);

    try {
      // 解析 PDF
      const parsed = await parsePDF(file);
      setIsUploading(false);
      setIsAnalyzing(true);

      // 分析简历
      const result = await analyzeResume(parsed.text, language);
      setAnalysis(result);
      setIsAnalyzing(false);

      // 通知父组件
      onAnalysisComplete?.(result, parsed.text);
    } catch (err) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setError(language === 'zh' ? '文件处理失败，请重试' : 'File processing failed, please try again');
      console.error('[ResumeClinic] Error:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setFileName('');
    setError(null);
    setShowDetails(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isProcessing = isUploading || isAnalyzing;

  if (compact && analysis) {
    // 紧凑模式：只显示已上传状态
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3"
      >
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-800 truncate">{fileName}</p>
          <p className="text-xs text-emerald-600">{t('resume.uploaded')}</p>
        </div>
        <button
          onClick={reset}
          className="text-emerald-600 hover:text-emerald-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all",
          isProcessing
            ? "border-blue-300 bg-blue-50/50"
            : analysis
              ? "border-emerald-300 bg-emerald-50/50"
              : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50",
          "p-6"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-3 text-center">
          {isProcessing ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-700">
                  {isUploading ? t('resume.uploading') : t('resume.analyzing')}
                </p>
                <p className="text-sm text-slate-500">{fileName}</p>
              </div>
            </>
          ) : analysis ? (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-emerald-700">{t('resume.analysisComplete')}</p>
                <p className="text-sm text-slate-500">{fileName}</p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Upload className="h-7 w-7 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-700">{t('resume.uploadTitle')}</p>
                <p className="text-sm text-slate-500">{t('resume.uploadDesc')}</p>
              </div>
            </>
          )}
        </div>

        {/* 清除按钮 */}
        {analysis && !isProcessing && (
          <button
            onClick={reset}
            className="absolute top-3 right-3 rounded-full bg-slate-200 p-1.5 text-slate-500 hover:bg-slate-300 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3"
          >
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <p className="text-sm text-rose-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 分析结果 */}
      <AnimatePresence>
        {analysis && !isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* 整体评价 */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5">
              <h4 className="font-bold text-blue-900 mb-2">{t('resume.summary')}</h4>
              <p className="text-sm text-blue-800 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* 关键信息 */}
            {(analysis.keyInfo.name !== '未找到（API 暂不可用）' ||
              analysis.keyInfo.education !== '未找到（API 暂不可用）' ||
              analysis.keyInfo.experience.length > 0 ||
              analysis.keyInfo.skills.length > 0) && (
              <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                <h4 className="font-medium text-slate-700 mb-3">{t('resume.keyInfo')}</h4>
                <div className="space-y-2 text-sm">
                  {analysis.keyInfo.name && analysis.keyInfo.name !== '未找到（API 暂不可用）' && (
                    <p><span className="text-slate-500">{t('resume.name')}:</span> {analysis.keyInfo.name}</p>
                  )}
                  {analysis.keyInfo.education && analysis.keyInfo.education !== '未找到（API 暂不可用）' && (
                    <p><span className="text-slate-500">{t('resume.education')}:</span> {analysis.keyInfo.education}</p>
                  )}
                  {analysis.keyInfo.experience.length > 0 && (
                    <p><span className="text-slate-500">{t('resume.experience')}:</span> {analysis.keyInfo.experience.join('；')}</p>
                  )}
                  {analysis.keyInfo.skills.length > 0 && (
                    <p><span className="text-slate-500">{t('resume.skills')}:</span> {analysis.keyInfo.skills.join('、')}</p>
                  )}
                </div>
              </div>
            )}

            {/* 展开/收起详情 */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors w-full justify-center"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {t('resume.hideDetails')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {t('resume.showDetails')}
                </>
              )}
            </button>

            {/* 详细分析 */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* 亮点 */}
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                    <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('resume.strengths')}
                    </h4>
                    <ul className="space-y-2">
                      {analysis.strengths.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-emerald-700">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-800">
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 不足 */}
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                    <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      {t('resume.weaknesses')}
                    </h4>
                    <ul className="space-y-2">
                      {analysis.weaknesses.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-amber-700">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-800">
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 建议 */}
                  <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                    <h4 className="font-bold text-blue-800 mb-3">{t('resume.suggestions')}</h4>
                    <ul className="space-y-2">
                      {analysis.suggestions.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-blue-700">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-200 text-xs font-bold text-blue-800">
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}