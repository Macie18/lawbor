/**
 * 企业风险查询组件
 * 
 * 功能：
 * 1. 手动输入企业名称查询
 * 2. 展示企业工商信息、劳动纠纷、司法风险、经营异常
 * 3. 支持从合同文本自动识别公司名称
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scale,
  FileWarning,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Briefcase,
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import { queryCompanyRisk, formatRiskReport } from '../services/qccService';
import type { CompanyRiskReport } from '../services/qccService';

interface CompanyRiskQueryProps {
  // 从合同提取的公司名称（自动填充）
  initialCompanyName?: string;
  // 查询成功回调
  onQuerySuccess?: (report: CompanyRiskReport) => void;
}

export default function CompanyRiskQuery({
  initialCompanyName = '',
  onQuerySuccess,
}: CompanyRiskQueryProps) {
  const { language } = useTranslation();
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CompanyRiskReport | null>(null);

  const handleQuery = async () => {
    if (!companyName.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const result = await queryCompanyRisk(companyName.trim());
      setReport(result);
      onQuerySuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '查询失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyInfo = () => {
    if (!report) return null;

    const { companyInfo } = report;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{companyInfo.name}</h3>
            <p className="text-sm text-slate-500">{companyInfo.businessStatus}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              {language === 'zh' ? '法人：' : 'Legal Rep: '}
              <span className="font-medium text-slate-900">{companyInfo.legalPerson}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              {language === 'zh' ? '注册资本：' : 'Capital: '}
              <span className="font-medium text-slate-900">{companyInfo.registeredCapital}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              {language === 'zh' ? '成立日期：' : 'Founded: '}
              <span className="font-medium text-slate-900">{companyInfo.establishDate}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              {language === 'zh' ? '信用代码：' : 'Credit Code: '}
              <span className="font-mono text-xs text-slate-900">{companyInfo.creditCode.slice(0, 10)}...</span>
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderRiskSummary = () => {
    if (!report) return null;

    const { riskSummary } = report;

    const levelConfig = {
      low: {
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        icon: CheckCircle,
        text: language === 'zh' ? '风险较低' : 'Low Risk',
      },
      medium: {
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        icon: AlertTriangle,
        text: language === 'zh' ? '存在风险' : 'Medium Risk',
      },
      high: {
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: XCircle,
        text: language === 'zh' ? '高风险' : 'High Risk',
      },
    };

    const config = levelConfig[riskSummary.overallRiskLevel];
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl border p-6 mb-6 ${config.color}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="h-8 w-8" />
            <div>
              <h4 className="text-lg font-bold">{config.text}</h4>
              <p className="text-sm opacity-80">
                {language === 'zh' ? '综合企业风险评估' : 'Overall Risk Assessment'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{riskSummary.laborDisputeCount}</div>
                <div className="text-xs opacity-70">
                  {language === 'zh' ? '劳动纠纷' : 'Labor Disputes'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{riskSummary.judicialRiskCount}</div>
                <div className="text-xs opacity-70">
                  {language === 'zh' ? '司法风险' : 'Judicial Risks'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{riskSummary.abnormalCount}</div>
                <div className="text-xs opacity-70">
                  {language === 'zh' ? '经营异常' : 'Abnormals'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderLaborDisputes = () => {
    if (!report || report.laborDisputes.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-violet-600" />
          <h4 className="font-bold text-slate-900">
            {language === 'zh' ? '劳动纠纷记录' : 'Labor Disputes'}
          </h4>
          <span className="ml-auto px-2 py-1 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
            {report.laborDisputes.length} {language === 'zh' ? '条' : 'records'}
          </span>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {report.laborDisputes.map((dispute, index) => (
            <div key={index} className="p-3 bg-slate-50 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-xs text-slate-500">{dispute.caseNo}</span>
                <span className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full">
                  {dispute.caseType}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1">{dispute.summary}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{dispute.filingDate}</span>
                <span>{dispute.caseStatus}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderJudicialRisks = () => {
    if (!report || report.judicialRisks.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <h4 className="font-bold text-slate-900">
            {language === 'zh' ? '司法风险' : 'Judicial Risks'}
          </h4>
          <span className="ml-auto px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
            {report.judicialRisks.length} {language === 'zh' ? '条' : 'records'}
          </span>
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {report.judicialRisks.map((risk, index) => (
            <div key={index} className="p-3 bg-red-50 rounded-xl border border-red-100">
              <div className="flex items-start justify-between mb-2">
                <span className="font-mono text-xs text-slate-500">{risk.caseNo}</span>
                <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                  {risk.caseType}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1">{risk.court}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{risk.filingDate}</span>
                {risk.amount && <span>标的：{risk.amount}</span>}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  const renderBusinessAbnormals = () => {
    if (!report || report.businessAbnormals.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-4"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileWarning className="h-5 w-5 text-amber-600" />
          <h4 className="font-bold text-slate-900">
            {language === 'zh' ? '经营异常' : 'Business Abnormals'}
          </h4>
          <span className="ml-auto px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            {report.businessAbnormals.length} {language === 'zh' ? '条' : 'records'}
          </span>
        </div>

        <div className="space-y-3">
          {report.businessAbnormals.map((abnormal, index) => (
            <div key={index} className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm font-medium text-slate-900 mb-1">{abnormal.reason}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>{abnormal.date}</span>
                <span>{abnormal.authority}</span>
                {abnormal.removed && (
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                    {language === 'zh' ? '已移出' : 'Removed'}
                  </span>
               )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div>
      {/* 输入查询卡片 */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              {language === 'zh' ? '企业风险查询' : 'Company Risk Query'}
            </h3>
            <p className="text-sm text-slate-500">
              {language === 'zh' ? '查询企业工商信息、劳动纠纷、司法风险' : 'Query company info, labor disputes, judicial risks'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder={language === 'zh' ? '请输入企业名称...' : 'Enter company name...'}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:bg-white"
            disabled={loading}
          />
          <button
            onClick={handleQuery}
            disabled={loading || !companyName.trim()}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {language === 'zh' ? '查询中' : 'Querying'}
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                {language === 'zh' ? '查询' : 'Query'}
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* 查询结果 */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {renderCompanyInfo()}
            {renderRiskSummary()}
            {renderLaborDisputes()}
            {renderJudicialRisks()}
            {renderBusinessAbnormals()}

            {/* 查询时间 */}
            <p className="text-xs text-slate-400 text-center mt-4">
              {language === 'zh' ? `数据更新于 ${report.dataUpdateDate}` : `Data updated on ${report.dataUpdateDate}`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}