/**
 * 企业风险显示组件 - 精简版
 * 用于合同审查页面的企业风险提示
 */

import { motion } from 'motion/react';
import {
  Building2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Scale,
  FileWarning,
  ChevronDown,
  ChevronUp,
  Users,
  Calendar,
  CreditCard,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import type { CompanyRiskReport } from '../services/qccService';
import { useState } from 'react';

interface CompanyRiskDisplayProps {
  report: CompanyRiskReport;
  compact?: boolean;
}

export default function CompanyRiskDisplay({ report, compact = false }: CompanyRiskDisplayProps) {
  const { language } = useTranslation();
  const [expandedCases, setExpandedCases] = useState<Set<number>>(new Set());

  if (!report) return null;

  const { companyInfo, riskSummary } = report;

  // 风险等级配置
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
    unknown: {
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      icon: AlertCircle,
      text: language === 'zh' ? '未知' : 'Unknown',
    },
  };

  const config = levelConfig[riskSummary.overallRiskLevel as keyof typeof levelConfig] || levelConfig.unknown;
  const Icon = config.icon;

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

  const isRecentCase = (dateStr: string) => {
    if (!dateStr || dateStr === '-') return false;
    const year = parseInt(dateStr.split('-')[0]);
    return year >= 2024;
  };

  return (
    <div className="space-y-3">
      {/* 企业基本信息 */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-slate-400" />
        <div className="flex-1">
          <h4 className="font-medium text-slate-900">{companyInfo.name}</h4>
          <p className="text-xs text-slate-500">{companyInfo.businessStatus}</p>
        </div>
      </div>
      
      {/* ✅ 添加信用代码显示 */}
      {companyInfo.creditCode && (
        <div className="flex items-center gap-2 text-xs">
          <Briefcase className="h-3 w-3 text-slate-400 flex-shrink-0" />
          <span className="text-slate-500">
            {language === 'zh' ? '信用代码：' : 'Credit Code: '}
          </span>
          <span className="font-mono text-slate-900 break-all">{companyInfo.creditCode}</span>
        </div>
      )}

      {/* 风险等级 */}
      <div className={`flex items-center gap-2 p-3 rounded-lg ${config.color}`}>
        <Icon className="h-5 w-5" />
        <div className="flex-1">
          <div className="font-medium text-sm">{config.text}</div>
          <div className="text-xs opacity-80">
            {language === 'zh' ? '综合风险评估' : 'Overall Assessment'}
          </div>
        </div>
        <div className="text-right">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-bold">{riskSummary.laborDisputeCount}</div>
              <div className="text-xs opacity-70">{language === 'zh' ? '劳动纠纷' : 'Labor'}</div>
            </div>
            <div>
              <div className="font-bold">{riskSummary.judicialRiskCount}</div>
              <div className="text-xs opacity-70">{language === 'zh' ? '司法' : 'Judicial'}</div>
            </div>
            <div>
              <div className="font-bold">{riskSummary.abnormalCount}</div>
              <div className="text-xs opacity-70">{language === 'zh' ? '异常' : 'Abnormal'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 劳动纠纷（前5条） */}
      {!compact && report.laborDisputes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Scale className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-medium text-slate-700">
              {language === 'zh' ? '劳动纠纷记录' : 'Labor Disputes'}
            </span>
            <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">
              {report.laborDisputes.length}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.laborDisputes.slice(0, 5).map((dispute, index) => {
              const isRecent = isRecentCase(dispute.filingDate);
              const isExpanded = expandedCases.has(index);

              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg border ${
                    isRecent ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  {isRecent && (
                    <div className="flex items-center gap-1 mb-1 text-xs font-bold text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      {language === 'zh' ? '近期案件' : 'Recent'}
                    </div>
                  )}

                  <div className="flex items-start justify-between text-xs">
                    <div className="flex-1">
                      <span className="font-mono text-slate-500">{dispute.caseNo}</span>
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
                    <span className={`px-1.5 py-0.5 rounded ${
                      isRecent ? 'bg-orange-100 text-orange-700' : 'bg-violet-100 text-violet-700'
                    }`}>
                      {dispute.caseType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dispute.filingDate}
                    </span>
                  </div>

                  {/* ✅ 收起状态：只显示原告被告，不显示裁判结果 */}
                  {!isExpanded && (
                    <div className="mt-2 space-y-1">
                      {/* 原告被告信息 */}
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
                  )}

                  <button
                    onClick={() => toggleCaseExpand(index)}
                    className="flex items-center gap-1 mt-2 text-xs text-violet-600 hover:text-violet-700"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? (language === 'zh' ? '收起详情' : 'Hide Details') : (language === 'zh' ? '查看完整详情' : 'View Full Details')}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-200 space-y-2 text-xs">
                      {/* ✅ 争议焦点（使用案由） */}
                      <div className="bg-blue-50 p-2 rounded border border-blue-100">
                        <div className="flex items-start gap-1">
                          <AlertCircle className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <span className="font-medium text-blue-900">
                              {language === 'zh' ? '争议焦点：' : 'Dispute Focus: '}
                            </span>
                            <span className="text-slate-900">{dispute.caseType}</span>
                          </div>
                        </div>
                      </div>

                      {/* 当事人信息 */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {dispute.plaintiff && dispute.plaintiff !== '-' && (
                          <div className="flex items-start gap-1 p-1.5 bg-green-50 rounded">
                            <Users className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium text-green-900">{language === 'zh' ? '原告：' : 'Plaintiff: '}</span>
                              <span className="text-slate-900">{dispute.plaintiff}</span>
                            </div>
                          </div>
                        )}
                        {dispute.defendant && dispute.defendant !== '-' && (
                          <div className="flex items-start gap-1 p-1.5 bg-red-50 rounded">
                            <Users className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <span className="font-medium text-red-900">{language === 'zh' ? '被告：' : 'Defendant: '}</span>
                              <span className="text-slate-900">{dispute.defendant}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 涉案金额 */}
                      {dispute.amount && dispute.amount !== '-' && (
                        <div className="flex items-center gap-1 p-1.5 bg-amber-50 rounded">
                          <CreditCard className="h-3 w-3 text-amber-600" />
                          <span className="font-medium text-amber-900">{language === 'zh' ? '涉案金额：' : 'Amount: '}</span>
                          <span className="font-bold text-amber-900">{dispute.amount}</span>
                        </div>
                      )}

                      {/* ✅ 立案日期 */}
                      {dispute.filingDate && dispute.filingDate !== '-' && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {language === 'zh' ? '立案日期：' : 'Filing Date: '}
                            {dispute.filingDate}
                          </span>
                        </div>
                      )}

                      {/* 案件状态/裁判结果 */}
                      {(dispute.caseStatus && dispute.caseStatus !== '-') || (dispute.judgmentResult && dispute.judgmentResult !== '-') ? (
                        <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                          <div className="flex items-start gap-2">
                            <Scale className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="font-medium text-purple-900 mb-1">
                                {language === 'zh' ? '裁判结果：' : 'Judgment Result: '}
                              </div>
                              <div className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                                {dispute.judgmentResult && dispute.judgmentResult !== '-' ? dispute.judgmentResult : dispute.caseStatus}
                              </div>
                              {dispute.judgmentDate && dispute.judgmentDate !== '-' && (
                                <div className="mt-2 pt-2 border-t border-purple-200 flex items-center gap-1 text-slate-600">
                                  <Calendar className="h-3 w-3" />
                                  <span>{language === 'zh' ? '裁判日期：' : 'Judgment Date: '}</span>
                                  <span className="font-medium">{dispute.judgmentDate}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {report.laborDisputes.length > 5 && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              {language === 'zh'
                ? `仅显示前 5 条，共 ${report.laborDisputes.length} 条`
                : `Showing top 5 of ${report.laborDisputes.length} records`}
            </p>
          )}
        </div>
      )}

      {/* 司法风险（前5条） */}
      {!compact && report.judicialRisks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-slate-700">
              {language === 'zh' ? '司法风险' : 'Judicial Risks'}
            </span>
            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
              {report.judicialRisks.length}
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {report.judicialRisks.slice(0, 5).map((risk, index) => {
              const globalIndex = report.laborDisputes.length + index;
              const isRecent = isRecentCase((risk as any).filingDate || '');
              const isExpanded = expandedCases.has(globalIndex);

              return (
                <div
                  key={index}
                  className={`p-2 rounded-lg border ${
                    isRecent ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-100'
                  }`}
                >
                  {isRecent && (
                    <div className="flex items-center gap-1 mb-1 text-xs font-bold text-orange-600">
                      <AlertCircle className="h-3 w-3" />
                      {language === 'zh' ? '近期案件' : 'Recent'}
                    </div>
                  )}

                  <div className="flex items-start justify-between text-xs">
                    <span className="font-mono text-slate-500">{risk.caseNo}</span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      isRecent ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {risk.caseType || (risk as any).caseReason}
                    </span>
                  </div>

                  {(risk as any).court && (
                    <p className="text-xs text-slate-600 mt-1">{(risk as any).court}</p>
                  )}

                  <button
                    onClick={() => toggleCaseExpand(globalIndex)}
                    className="flex items-center gap-1 mt-1 text-xs text-red-600 hover:text-red-700"
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {isExpanded ? (language === 'zh' ? '收起' : 'Hide') : (language === 'zh' ? '详情' : 'Details')}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 text-xs">
                      {(risk as any).documentTitle && (
                        <div className="flex items-start gap-1">
                          <FileWarning className="h-3 w-3 text-blue-600 mt-0.5" />
                          <span className="text-slate-600">{language === 'zh' ? '文书：' : 'Document: '}</span>
                          <span>{(risk as any).documentTitle}</span>
                        </div>
                      )}
                      {(risk as any).judgmentResult && (
                        <div className="bg-purple-50 p-1.5 rounded text-slate-900">
                          {(risk as any).judgmentResult}
                        </div>
                      )}
                      {(risk as any).amount && (
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-amber-600" />
                          <span className="text-slate-600">{language === 'zh' ? '金额：' : 'Amount: '}</span>
                          <span className="font-semibold">{(risk as any).amount}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 经营异常 */}
      {!compact && report.businessAbnormals.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <FileWarning className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-slate-700">
              {language === 'zh' ? '经营异常' : 'Business Abnormals'}
            </span>
            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
              {report.businessAbnormals.length}
            </span>
          </div>

          <div className="space-y-1">
            {report.businessAbnormals.slice(0,3).map((abnormal, index) => (
              <div key={index} className="p-2 bg-amber-50 rounded border border-amber-100">
                <p className="text-xs font-medium text-slate-900">{abnormal.reason}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>{abnormal.date}</span>
                  {abnormal.removed && (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                      {language === 'zh' ? '已移出' : 'Removed'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 数据更新时间 */}
      <p className="text-xs text-slate-400 text-center">
        {language === 'zh' ? `数据更新于 ${report.dataUpdateDate}` : `Updated: ${report.dataUpdateDate}`}
      </p>
    </div>
  );
}