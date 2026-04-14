/**
 * 企业风险查询页面 - 手动输入版
 * 
 * 功能：
 * 1. 手动输入企业名称查询
 * 2. 展示工商信息、劳动纠纷、司法风险
 * 3. 详细展开案件信息
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronDown,
  ChevronUp,
  Users,
  AlertCircle,
  ArrowLeft,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import { queryCompanyRisk } from '../services/qccService';
import type { CompanyRiskReport } from '../services/qccService';

export default function CompanyRiskPage() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CompanyRiskReport | null>(null);
  const [expandedCases, setExpandedCases] = useState<Set<number>>(new Set());

  const handleQuery = async () => {
    if (!companyName.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setExpandedCases(new Set());

    try {
      const result = await queryCompanyRisk(companyName.trim());
      setReport(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '查询失败，请稍后重试';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isRecentCase = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return false;
    const year = parseInt(dateStr.split('-')[0]);
    return year >= 2024;
  };

  const parseParties = (partiesStr: string) => {
    try {
      return JSON.parse(partiesStr);
    } catch {
      return null;
    }
  };

  const toggleCaseExpand = (index: number) => {
    setExpandedCases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const renderCompanyInfo = () => {
    if (!report) return null;
    const { companyInfo } = report;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm"
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
        </div>
        
        {/* ✅ 信用代码单独一行完整显示 */}
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Briefcase className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <span className="text-slate-600">
            {language === 'zh' ? '信用代码：' : 'Credit Code: '}
          </span>
          <span className="font-mono text-xs text-slate-900 break-all">{companyInfo.creditCode}</span>
        </div>

        {/* 经营范围 */}
        {companyInfo.businessScope && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-start gap-2 text-sm">
              <Briefcase className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <span className="font-medium text-slate-600">
                  {language === 'zh' ? '经营范围：' : 'Business Scope: '}
                </span>
                <span className="text-slate-900">{companyInfo.businessScope}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderRiskSummary = () => {
    if (!report) return null;
    const { riskSummary } = report;

    if (riskSummary.overallRiskLevel === 'unknown') {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 bg-slate-50 p-6 mb-6"
        >
          <div className="flex items-center gap-3">
            <Search className="h-8 w-8 text-slate-400" />
            <div>
              <h4 className="text-lg font-bold text-slate-600">
                {language === 'zh' ? '未找到企业' : 'Company Not Found'}
              </h4>
              <p className="text-sm text-slate-500">
                {language === 'zh'
                  ? '请确认企业名称是否正确，建议使用完整企业名称（如：XX科技有限公司）'
                  : 'Please verify the company name. Try using the full name (e.g., XX Technology Co., Ltd.)'}
              </p>
            </div>
          </div>
        </motion.div>
      );
    }

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

    const config = levelConfig[riskSummary.overallRiskLevel as 'low' | 'medium' | 'high'];
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
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-4 shadow-sm"
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

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {report.laborDisputes.map((dispute, index) => {
            const isRecent = isRecentCase(dispute.filingDate);
            const isExpanded = expandedCases.has(index);

            return (
              <motion.div
                key={index}
                layout
                className={`p-4 rounded-xl border transition-all ${
                  isRecent
                    ? 'bg-orange-50 border-orange-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                {isRecent && (
                  <div className="flex items-center gap-1 mb-2 text-xs font-bold text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    {language === 'zh' ? '近期案件，需重点关注' : 'Recent case, attention needed'}
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <span className="font-mono text-xs text-slate-500">
                      {(dispute as any).案号 || dispute.caseNo}
                    </span>
                    {/* ✅ 添加案件来源标识 */}
                    {dispute.judgmentResult && dispute.judgmentResult !== '-' ? (
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        {language === 'zh' ? '已判决' : 'Judged'}
                      </span>
                    ) : (
                      <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {language === 'zh' ? '立案中' : 'Filed'}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isRecent ? 'bg-orange-100 text-orange-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {(dispute as any).案由 || dispute.caseType || dispute.caseReason}
                  </span>
                </div>

                {/* ✅ 收起状态显示关键信息 */}
                <div className="mb-2">
                  {/* 原告被告 */}
                  <div className="text-xs text-slate-600">
                    {dispute.plaintiff && dispute.plaintiff !== '-' && (
                      <span className="mr-2">
                        {language === 'zh' ? '原告：' : 'Plaintiff: '}
                        <span className="font-medium text-slate-900">{dispute.plaintiff}</span>
                      </span>
                    )}
                    {dispute.defendant && dispute.defendant !== '-' && (
                      <span>
                        {language === 'zh' ? '被告：' : 'Defendant: '}
                        <span className="font-medium text-slate-900">{dispute.defendant}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {(dispute as any).立案日期 || dispute.filingDate}
                  </span>
                  {(dispute as any).案件状态 && <span>{(dispute as any).案件状态}</span>}
                </div>

                <button
                  onClick={() => toggleCaseExpand(index)}
                  className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      {language === 'zh' ? '收起详情' : 'Hide Details'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      {language === 'zh' ? '查看详细案件信息' : 'View Case Details'}
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                        {/* 争议焦点 */}
                        <div className="flex items-start gap-2 bg-blue-50 p-2 rounded border border-blue-100">
                          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div>
                            <span className="font-medium text-blue-900 text-sm">
                              {language === 'zh' ? '争议焦点：' : 'Focus: '}
                            </span>
                            <span className="text-slate-900 text-sm">
                              {dispute.caseType || dispute.caseReason || (dispute as any).案由 || '劳动争议'}
                            </span>
                          </div>
                        </div>

                        {/* 原告 */}
                        {((dispute as any).当事人?.原告 || dispute.plaintiff) && (
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-green-600 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-600 text-sm">
                                {language === 'zh' ? '原告：' : 'Plaintiff: '}
                              </span>
                              <span className="text-slate-900 text-sm">
                                {Array.isArray((dispute as any).当事人?.原告) 
                                  ? (dispute as any).当事人.原告.join('、') 
                                  : dispute.plaintiff}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 被告 */}
                        {((dispute as any).当事人?.被告 || dispute.defendant) && (
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-red-600 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-600 text-sm">
                                {language === 'zh' ? '被告：' : 'Defendant: '}
                              </span>
                              <span className="text-slate-900 text-sm">
                                {Array.isArray((dispute as any).当事人?.被告) 
                                  ? (dispute as any).当事人.被告.join('、') 
                                  : dispute.defendant}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* 涉案金额 */}
                        {dispute.amount && dispute.amount !== '-' && (
                          <div className="flex items-start gap-2">
                            <CreditCard className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-600 text-sm">
                                {language === 'zh' ? '涉案金额：' : 'Amount: '}
                              </span>
                              <span className="text-slate-900 text-sm font-semibold">{dispute.amount}</span>
                            </div>
                          </div>
                        )}

                        {/* 立案日期 */}
                        {dispute.filingDate && dispute.filingDate !== '-' && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {language === 'zh' ? '立案日期：' : 'Filing Date: '}
                              {dispute.filingDate}
                            </span>
                          </div>
                        )}

                        {/* 案件状态 */}
                        {dispute.caseStatus && dispute.caseStatus !== '-' && (
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '案件状态：' : 'Status: '}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                {dispute.caseStatus}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* ✅ 裁判结果 */}
                        {((dispute as any).裁判结果 || dispute.judgmentResult) && ((dispute as any).裁判结果 !== '-' || dispute.judgmentResult !== '-') && (
                          <div className="flex items-start gap-2">
                            <Scale className="h-4 w-4 text-purple-600 mt-0.5" />
                            <div className="text-sm flex-1">
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '裁判结果：' : 'Judgment: '}
                              </span>
                              <div className="mt-1 p-2 bg-purple-50 rounded border border-purple-100 text-slate-900">
                                {(dispute as any).裁判结果 || dispute.judgmentResult}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ✅ 裁判日期 */}
                        {((dispute as any).裁判日期 || dispute.judgmentDate) && ((dispute as any).裁判日期 !== '-' || dispute.judgmentDate !== '-') && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {language === 'zh' ? '裁判日期：' : 'Judgment Date: '}
                              {(dispute as any).裁判日期 || dispute.judgmentDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderJudicialRisks = () => {
    if (!report || report.judicialRisks.length === 0) return null;

    const offsetIndex = report.laborDisputes.length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-4 shadow-sm"
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

        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {report.judicialRisks.map((risk, index) => {
            const globalIndex = offsetIndex + index;
            const isRecent = isRecentCase(risk.filingDate || '');
            const isExpanded = expandedCases.has(globalIndex);

            return (
              <motion.div
                key={index}
                layout
                className={`p-4 rounded-xl border transition-all ${
                  isRecent
                    ? 'bg-orange-50 border-orange-300 shadow-sm'
                    : 'bg-red-50 border-red-100'
                }`}
              >
                {isRecent && (
                  <div className="flex items-center gap-1 mb-2 text-xs font-bold text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    {language === 'zh' ? '近期案件，需重点关注' : 'Recent case, attention needed'}
                  </div>
                )}

                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-slate-500">
                    {(risk as any).案号 || risk.caseNo}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isRecent ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {(risk as any).案由 || risk.caseType || risk.caseReason}
                  </span>
                </div>

                {/* 文书标题作为预览 */}
                {((risk as any).文书标题 || (risk as any).documentTitle) && (
                  <p className="text-sm font-medium text-slate-900 mb-2">
                    {(risk as any).文书标题 || (risk as any).documentTitle}
                  </p>
                )}

                {((risk as any).法院 || risk.court) && (
                  <p className="text-sm text-slate-600 mb-2">
                    {(risk as any).法院 || risk.court}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                  {((risk as any).立案日期 || (risk as any).裁判日期 || risk.filingDate) && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {(risk as any).立案日期 || (risk as any).裁判日期 || risk.filingDate}
                    </span>
                  )}
                  {((risk as any).案件金额 || risk.amount) && ((risk as any).案件金额 !== '' || risk.amount) && (
                    <span>标的：{(risk as any).案件金额 || risk.amount}</span>
                  )}
                </div>

                <button
                  onClick={() => toggleCaseExpand(globalIndex)}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      {language === 'zh' ? '收起详情' : 'Hide Details'}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      {language === 'zh' ? '查看详细案件信息' : 'View Case Details'}
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
                        {/* 当事人 */}
                        {((risk as any).当事人 || (risk as any).parties) && (
                          <div className="flex items-start gap-2">
                            <Users className="h-4 w-4 text-slate-400 mt-0.5" />
                            <div className="text-sm">
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '当事人：' : 'Parties: '}
                              </span>
                              <div className="mt-1">
                                {(() => {
                                  const partiesData = (risk as any).当事人 || (risk as any).parties;
                                  // 如果是字符串，尝试解析为 JSON
                                  let parties = typeof partiesData === 'string' 
                                    ? parseParties(partiesData) 
                                    : partiesData;
                                  
                                  if (!parties || typeof parties !== 'object') {
                                    return <span className="text-slate-900">{partiesData}</span>;
                                  }
                                  
                                  return (
                                    <>
                                      {parties['原告'] && Array.isArray(parties['原告']) && (
                                        <div className="text-green-700">
                                          {language === 'zh' ? '原告：' : 'Plaintiff: '}{parties['原告'].join('、')}
                                        </div>
                                      )}
                                      {parties['被告'] && Array.isArray(parties['被告']) && (
                                        <div className="text-red-700">
                                          {language === 'zh' ? '被告：' : 'Defendant: '}{parties['被告'].join('、')}
                                        </div>
                                      )}
                                      {parties['上诉人'] && Array.isArray(parties['上诉人']) && (
                                        <div className="text-blue-700">
                                          {language === 'zh' ? '上诉人：' : 'Appellant: '}{parties['上诉人'].join('、')}
                                        </div>
                                      )}
                                      {parties['被上诉人'] && Array.isArray(parties['被上诉人']) && (
                                        <div className="text-purple-700">
                                          {language === 'zh' ? '被上诉人：' : 'Appellee: '}{parties['被上诉人'].join('、')}
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 文书标题 */}
                        {((risk as any).文书标题 || (risk as any).documentTitle) && (
                          <div className="flex items-start gap-2">
                            <FileWarning className="h-4 w-4 text-blue-600 mt-0.5" />
                            <div className="text-sm">
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '文书标题：' : 'Document: '}
                              </span>
                              <span className="text-slate-900">{(risk as any).文书标题 || (risk as any).documentTitle}</span>
                            </div>
                          </div>
                        )}

                        {/* 裁判结果 */}
                        {((risk as any).裁判结果 || (risk as any).judgmentResult) && (
                          <div className="flex items-start gap-2">
                            <Scale className="h-4 w-4 text-purple-600 mt-0.5" />
                            <div className="text-sm flex-1">
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '裁判结果：' : 'Judgment: '}
                              </span>
                              <div className="mt-1 p-2 bg-purple-50 rounded border border-purple-100 text-slate-900">
                                {(risk as any).裁判结果 || (risk as any).judgmentResult}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 案件金额 */}
                        {((risk as any).案件金额 || (risk as any).amount) && ((risk as any).案件金额 !== '' || (risk as any).amount) && (
                          <div className="flex items-start gap-2">
                            <CreditCard className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div className="text-sm">
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '案件金额：' : 'Amount: '}
                              </span>
                              <span className="text-slate-900 font-semibold">{(risk as any).案件金额 || (risk as any).amount}</span>
                            </div>
                          </div>
                        )}

                        {/* 发布日期 */}
                        {((risk as any).发布日期 || (risk as any).publishDate) && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {language === 'zh' ? '发布日期：' : 'Published: '}
                              {(risk as any).发布日期 || (risk as any).publishDate}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
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
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-4 shadow-sm"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
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
            <Shield className="h-10 w-10 text-violet-600" />
            <h1 className="text-3xl font-bold text-slate-900">
              {language === 'zh' ? '企业风险审查' : 'Company Risk Review'}
            </h1>
          </div>
          <p className="text-slate-600">
            {language === 'zh'
              ? '输入企业名称，全面了解企业风险状况'
              : 'Enter company name to review risk status'}
          </p>
        </motion.div>

        {/* 搜索卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-200 p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Search className="h-5 w-5" />
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
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:bg-white transition-all"
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
        </motion.div>

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

              <p className="text-xs text-slate-400 text-center mt-6">
                {language === 'zh' ? `数据更新于 ${report.dataUpdateDate}` : `Data updated on ${report.dataUpdateDate}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}