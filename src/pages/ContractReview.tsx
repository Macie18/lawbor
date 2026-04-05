import { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from '../contexts/TranslationContext';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function ContractReview() {
  const { t, language } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);

    try {
      const model = 'gemini-3-flash-preview';
      const prompt = language === 'zh'
        ? "你是一个专业的中国劳动法律助手。用户上传了一份劳动合同（模拟）。请列出该合同中可能存在的风险点（如：试用期过长、违约金不合理、加班费未明确等），并给出修改建议。请使用 Markdown 格式输出，包含风险等级（高、中、低）。"
        : "You are a professional Chinese labor law assistant. The user has uploaded a labor contract (simulated). Please list the potential risk points in the contract (e.g., probation period too long, unreasonable liquidated damages, unclear overtime pay, etc.) and provide modification suggestions. Please output in Markdown format, including risk levels (High, Medium, Low).";
      
      const result = await genAI.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
        ],
      });

      setResult(result.text || (language === 'zh' ? '分析失败，请重试。' : 'Analysis failed, please try again.'));
    } catch (error) {
      console.error('Contract Review Error:', error);
      setResult(language === 'zh' ? '抱歉，分析过程中出现错误。' : 'Sorry, an error occurred during the analysis.');
    } finally {
      setLoading(false);
    }
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
                  <Upload className="h-8 w-8" />
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
          <div className="min-h-[400px] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center py-20">
                <Loader2 className="mb-4 h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500">{t('contract.analyzing')}</p>
              </div>
            ) : result ? (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
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
