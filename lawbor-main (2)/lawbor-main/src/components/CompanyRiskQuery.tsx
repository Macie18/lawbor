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
  ChevronDown,
  ChevronUp,
  Users,
  AlertCircle,
  TrendingUp,
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
  
  // ✅ 新增：展开的案件索引
  const [expandedCases, setExpandedCases] = useState<Set<number>>(new Set());

  const handleQuery = async () => {
    if (!companyName.trim()) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setExpandedCases(new Set()); // 重置展开状态

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

  // ✅ 辅助函数：判断是否是最近的案件（2024年以后）
  const isRecentCase = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return false;
    const year = parseInt(dateStr.split('-')[0]);
    return year >= 2024;
  };

  // ✅ 辅助函数：解析当事人 JSON 字符串
  const parseParties = (partiesStr: string) => {
    try {
      return JSON.parse(partiesStr);
    } catch {
      return null;
    }
  };

  // ✅ 切换案件展开状态
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

    // ✅ 处理未找到企业的情况
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

  // ✅ 新增：时间线图表组件
  const renderTimeline = () => {
    if (!report) return null;
    
    // 合并所有案件并提取年份
    const allCases = [
      ...report.laborDisputes.map(d => ({ ...d, type: 'labor' })),
      ...report.judicialRisks.map(d => ({ ...d, type: 'judicial' })),
    ];
    
    if (allCases.length === 0) return null;

    // 按年份统计
    const yearStats: Record<number, { labor: number; judicial: number; total: number }> = {};
    allCases.forEach(caseItem => {
      const dateField = caseItem.filingDate || '';
      const year = parseInt(dateField.split('-')[0]);
      if (!isNaN(year) && year > 2000) {
        if (!yearStats[year]) {
          yearStats[year] = { labor: 0, judicial: 0, total: 0 };
        }
        if (caseItem.type === 'labor') {
          yearStats[year].labor++;
        } else {
          yearStats[year].judicial++;
        }
        yearStats[year].total++;
      }
    });

    const years = Object.keys(yearStats).map(Number).sort((a, b) => a - b);
    const maxTotal = Math.max(...Object.values(yearStats).map(s => s.total), 1);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-slate-200 p-6 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h4 className="font-bold text-slate-900">
            {language === 'zh' ? '案件时间线' : 'Case Timeline'}
          </h4>
          <span className="ml-auto px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            {language === 'zh' ? `${allCases.length} 条记录` : `${allCases.length} records`}
          </span>
        </div>

        {/* 时间线柱状图 */}
        <div className="flex items-end gap-2 h-32">
          {years.map(year => {
            const stats = yearStats[year];
            const height = (stats.total / maxTotal) * 100;
            const isRecent = year >= 2024;
            
            return (
              <div key={year} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-600">{stats.total}</div>
                <div 
                  className={`w-full rounded-t-lg transition-all ${isRecent ? 'bg-gradient-to-t from-orange-400 to-red-500' : 'bg-gradient-to-t from-blue-400 to-blue-600'}`}
                  style={{ height: `${height}%` }}
                />
                <div className={`text-xs font-medium ${isRecent ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                  {year}
                </div>
              </div>
            );
          })}
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-xs text-slate-600">{language === 'zh' ? '历史案件' : 'Historical'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-xs text-slate-600">{language === 'zh' ? '近期案件（2024+）' : 'Recent (2024+)'}</span>
          </div>
          <div className="ml-auto flex items-center gap-1 text-xs text-slate-500">
            <AlertCircle className="h-3 w-3" />
            {language === 'zh' ? '需重点关注' : 'Focus needed'}
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

        <div className="space-y-3 max-h-96 overflow-y-auto">
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
                {/* ✅ 最近案件标记 */}
                {isRecent && (
                  <div className="flex items-center gap-1 mb-2 text-xs font-bold text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    {language === 'zh' ? '近期案件，需重点关注' : 'Recent case, attention needed'}
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-slate-500">{dispute.caseNo}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isRecent ? 'bg-orange-100 text-orange-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {dispute.caseType}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{dispute.summary}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {dispute.filingDate}
                  </span>
                  <span>{dispute.caseStatus}</span>
                </div>

                {/* ✅ 查看详细案件信息按钮 */}
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

                {/* ✅ 展开的详细信息 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        {dispute.plaintiff && dispute.plaintiff !== '-' && (
                          <div className="flex items-start gap-2 text-xs">
                            <Users className="h-3 w-3 text-slate-400 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '原告：' : 'Plaintiff: '}
                              </span>
                              <span className="text-slate-900">{dispute.plaintiff}</span>
                            </div>
                          </div>
                        )}
                        {dispute.defendant && dispute.defendant !== '-' && (
                          <div className="flex items-start gap-2 text-xs">
                            <Users className="h-3 w-3 text-slate-400 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '被告：' : 'Defendant: '}
                              </span>
                              <span className="text-slate-900">{dispute.defendant}</span>
                            </div>
                          </div>
                        )}
                        {dispute.amount && dispute.amount !== '-' && (
                          <div className="flex items-start gap-2 text-xs">
                            <CreditCard className="h-3 w-3 text-slate-400 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '涉案金额：' : 'Amount: '}
                              </span>
                              <span className="text-slate-900">{dispute.amount}</span>
                            </div>
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

    // 为司法风险添加偏移索引（避免与劳动纠纷索引冲突）
    const offsetIndex = report.laborDisputes.length;

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

        <div className="space-y-3 max-h-96 overflow-y-auto">
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
                {/* ✅ 最近案件标记 */}
                {isRecent && (
                  <div className="flex items-center gap-1 mb-2 text-xs font-bold text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    {language === 'zh' ? '近期案件，需重点关注' : 'Recent case, attention needed'}
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-xs text-slate-500">{risk.caseNo}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isRecent ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {risk.caseType || risk.caseReason}
                  </span>
                </div>
                
                {risk.court && (
                  <p className="text-sm text-slate-600 mb-2">{risk.court}</p>
                )}
                
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2">
                  {risk.filingDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {risk.filingDate}
                    </span>
                  )}
                  {risk.amount && <span>标的：{risk.amount}</span>}
                </div>

                {/* ✅ 查看详细案件信息按钮 */}
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

                {/* ✅ 展开的详细信息 */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                        {(risk as any).parties && (
                          <div className="flex items-start gap-2 text-xs">
                            <Users className="h-3 w-3 text-slate-400 mt-0.5" />
                            <div>
                              <span className="font-medium text-slate-600">
                                {language === 'zh' ? '当事人：' : 'Parties: '}
                              </span>
                              <span className="text-slate-900">
                                {(() => {
                                  const parties = parseParties((risk as any).parties);
                                  if (!parties) return (risk as any).parties;
                                  const parts = [];
                                  if (parties['原告']) parts.push(`原告：${parties['原告'].join('、')}`);
                                  if (parties['被告']) parts.push(`被告：${parties['被告'].join('、')}`);
                                  return parts.join('；');
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                        {(risk as any).documentTitle && (
                          <div className="text-xs text-slate-600">
                            <span className="font-medium">{language === 'zh' ? '文书标题：' : 'Document: '}</span>
                            {(risk as any).documentTitle}
                          </div>
                        )}
                        {(risk as any).judgmentResult && (
                          <div className="text-xs text-slate-600">
                            <span className="font-medium">{language === 'zh' ? '裁判结果：' : 'Result: '}</span>
                            {(risk as any).judgmentResult}
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
            {renderTimeline()}
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