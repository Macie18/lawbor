import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  ArrowRight,
  Gavel,
  FileCheck,
  ClipboardList,
  Send,
  Calendar,
  Scale
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

// 仲裁事由选项
const ARBITRATION_REASONS = {
  zh: [
    { value: 'unpaid_wages', label: '拖欠工资', evidence: '工资条、银行流水、考勤记录' },
    { value: 'unpaid_overtime', label: '加班费争议', evidence: '考勤记录、工作邮件、加班审批单' },
    { value: 'illegal_dismissal', label: '违法解除劳动合同', evidence: '解除通知书、录音录像、聊天记录' },
    { value: 'no_contract', label: '未签书面劳动合同', evidence: '入职通知、工资发放记录、工作证' },
    { value: 'social_security', label: '未缴纳社保', evidence: '社保缴费记录、工资条、劳动合同' },
    { value: 'work_injury', label: '工伤赔偿争议', evidence: '工伤认定书、医疗记录、证人证言' },
    { value: 'severance', label: '经济补偿金争议', evidence: '解除通知书、工资条、工作年限证明' },
    { value: 'other', label: '其他争议', evidence: '相关证据材料' },
  ],
  en: [
    { value: 'unpaid_wages', label: 'Unpaid Wages', evidence: 'Pay slips, Bank statements, Attendance records' },
    { value: 'unpaid_overtime', label: 'Overtime Pay Dispute', evidence: 'Attendance records, Work emails, Overtime approval' },
    { value: 'illegal_dismissal', label: 'Illegal Dismissal', evidence: 'Dismissal notice, Audio/Video recordings, Chat logs' },
    { value: 'no_contract', label: 'No Written Contract', evidence: 'Job offer, Pay records, Work ID' },
    { value: 'social_security', label: 'Social Security Not Paid', evidence: 'Social security records, Pay slips, Labor contract' },
    { value: 'work_injury', label: 'Work Injury Compensation', evidence: 'Work injury certificate, Medical records, Witness statements' },
    { value: 'severance', label: 'Severance Pay Dispute', evidence: 'Dismissal notice, Pay slips, Work tenure proof' },
    { value: 'other', label: 'Other Disputes', evidence: 'Relevant evidence materials' },
  ],
};

// 仲裁流程步骤
const ARBITRATION_STEPS = {
  zh: [
    {
      id: 1,
      title: '准备阶段',
      description: '收集证据、填写申请书',
      icon: ClipboardList,
      duration: '1-3天',
      details: ['整理证据材料', '填写仲裁申请书', '准备身份证明文件']
    },
    {
      id: 2,
      title: '提交申请',
      description: '向仲裁委员会递交材料',
      icon: Send,
      duration: '1天',
      details: ['提交申请书和证据', '缴纳仲裁费用', '领取受理通知书']
    },
    {
      id: 3,
      title: '受理审查',
      description: '仲裁委审查是否受理',
      icon: FileCheck,
      duration: '5个工作日',
      details: ['审查材料完整性', '决定是否受理', '发送受理通知书']
    },
    {
      id: 4,
      title: '开庭准备',
      description: '通知开庭时间和地点',
      icon: Calendar,
      duration: '10-30天',
      details: ['确定开庭日期', '送达开庭通知', '准备答辩材料']
    },
    {
      id: 5,
      title: '仲裁庭审',
      description: '双方陈述、举证质证',
      icon: Gavel,
      duration: '1天',
      details: ['陈述仲裁请求', '举证质证', '双方辩论']
    },
    {
      id: 6,
      title: '裁决结果',
      description: '仲裁庭作出裁决',
      icon: Scale,
      duration: '45天内',
      details: ['合议庭评议', '制作裁决书', '送达裁决书']
    },
  ],
  en: [
    {
      id: 1,
      title: 'Preparation',
      description: 'Gather evidence, fill out application',
      icon: ClipboardList,
      duration: '1-3 days',
      details: ['Organize evidence', 'Fill out application', 'Prepare ID documents']
    },
    {
      id: 2,
      title: 'Submit Application',
      description: 'Submit materials to arbitration commission',
      icon: Send,
      duration: '1 day',
      details: ['Submit application and evidence', 'Pay arbitration fee', 'Receive acceptance notice']
    },
    {
      id: 3,
      title: 'Review & Acceptance',
      description: 'Commission reviews for acceptance',
      icon: FileCheck,
      duration: '5 working days',
      details: ['Review material completeness', 'Decide on acceptance', 'Send acceptance notice']
    },
    {
      id: 4,
      title: 'Pre-hearing',
      description: 'Notify hearing date and location',
      icon: Calendar,
      duration: '10-30 days',
      details: ['Set hearing date', 'Deliver hearing notice', 'Prepare defense materials']
    },
    {
      id: 5,
      title: 'Arbitration Hearing',
      description: 'Both parties present and cross-examine',
      icon: Gavel,
      duration: '1 day',
      details: ['State arbitration claims', 'Present and cross-examine evidence', 'Debate']
    },
    {
      id: 6,
      title: 'Final Award',
      description: 'Arbitration tribunal issues ruling',
      icon: Scale,
      duration: 'Within 45 days',
      details: ['Panel deliberation', 'Draft award document', 'Deliver award']
    },
  ],
};

export default function Arbitration() {
  const { t, language } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [activeStep, setActiveStep] = useState<number>(1);

  const reasons = ARBITRATION_REASONS[language];
  const steps = ARBITRATION_STEPS[language];

  const selectedReasonData = reasons.find(r => r.value === selectedReason);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-slate-900">{t('arbitration.title')}</h2>
        <p className="text-slate-500">{t('arbitration.desc')}</p>
      </header>

      {/* 重要提示 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl border-l-4 border-amber-500 bg-amber-50 p-6"
      >
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
          <div>
            <h3 className="mb-2 font-bold text-amber-900">{t('arbitration.warningTitle')}</h3>
            <p className="text-sm text-amber-800">{t('arbitration.warningDesc')}</p>
          </div>
        </div>
      </motion.div>

      {/* 主要内容：左右布局 */}
      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* 左侧：下载文书 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('arbitration.template')}</h3>
                <p className="text-sm text-slate-500">{t('arbitration.templateDesc')}</p>
              </div>
            </div>

            {/* 事由选择 */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-bold text-slate-700">
                {language === 'zh' ? '选择仲裁事由' : 'Select Arbitration Reason'}
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-blue-500 focus:bg-white"
              >
                <option value="">{language === 'zh' ? '请选择...' : 'Please select...'}</option>
                {reasons.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}（{language === 'zh' ? '含证据清单' : 'Evidence List'}）
                  </option>
                ))}
              </select>
            </div>

            {/* 证据清单提示 */}
            {selectedReasonData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 rounded-xl bg-blue-50 p-4"
              >
                <h4 className="mb-2 text-sm font-bold text-blue-900">
                  {language === 'zh' ? '📋 所需证据材料：' : '📋 Required Evidence:'}
                </h4>
                <p className="text-sm text-blue-800">{selectedReasonData.evidence}</p>
              </motion.div>
            )}

            {/* 下载按钮 */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  if (!selectedReason) return;
                  // 根据仲裁事由下载对应模板
                  const templateMap: Record<string, string> = {
                    unpaid_wages: 'template_salary.docx',
                    unpaid_overtime: 'template_overtime.docx',
                    illegal_dismissal: 'template_compensation.docx',
                    no_contract: 'template_relation.docx',
                    social_security: 'template_social_security.docx',
                    work_injury: 'template_injury.docx',
                    severance: 'template_compensation.docx',
                    other: 'template_general.docx',
                  };
                  const templateFile = templateMap[selectedReason] || 'template_general.docx';
                  const link = document.createElement('a');
                  link.href = `/templates/${templateFile}`;
                  link.download = templateFile;
                  link.click();
                }}
                disabled={!selectedReason}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-bold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-5 w-5" />
                {t('arbitration.download')}
              </button>
              
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/templates/template_general.docx';
                  link.download = 'template_general.docx';
                  link.click();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-700 transition-all hover:bg-slate-50"
              >
                <FileText className="h-5 w-5" />
                {language === 'zh' ? '下载通用模板' : 'Download General Template'}
              </button>
            </div>
          </div>

          {/* 关键要点 */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">{t('arbitration.points')}</h3>
            <div className="space-y-3">
              {[
                { icon: CheckCircle, text: language === 'zh' ? '劳动仲裁免费（大部分地区）' : 'Labor arbitration is free (in most regions)', color: 'text-emerald-600' },
                { icon: Clock, text: language === 'zh' ? '仲裁时效：权益受损之日起 1 年内' : 'Arbitration limitation: within 1 year from rights violation', color: 'text-blue-600' },
                { icon: Users, text: language === 'zh' ? '可委托代理人参加仲裁' : 'Can authorize an agent to attend arbitration', color: 'text-violet-600' },
                { icon: AlertTriangle, text: language === 'zh' ? '对裁决不服可向法院起诉' : 'Can file a lawsuit if dissatisfied with the award', color: 'text-amber-600' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <item.icon className={`h-5 w-5 shrink-0 ${item.color}`} />
                  <p className="text-sm text-slate-700">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 右侧：仲裁流程示意图 */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-bold text-slate-900">
            {language === 'zh' ? '仲裁流程示意图' : 'Arbitration Process Flowchart'}
          </h3>

          {/* 流程步骤 */}
          <div className="relative space-y-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div
                  onClick={() => setActiveStep(step.id)}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all ${
                    activeStep === step.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* 步骤编号 */}
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                      activeStep === step.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      <step.icon className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400">Step {step.id}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-400">{step.duration}</span>
                      </div>
                      <h4 className="font-bold text-slate-900">{step.title}</h4>
                      <p className="text-sm text-slate-600">{step.description}</p>

                      {/* 详情展开 */}
                      {activeStep === step.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 space-y-2"
                        >
                          {step.details.map((detail, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                              <span>{detail}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 连接箭头 */}
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-full flex h-6 w-full items-center justify-center">
                    <ArrowRight className="h-4 w-4 rotate-90 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* 时间提示 */}
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-600">
              {language === 'zh' 
                ? '💡 整个仲裁流程通常需要 45-60 天' 
                : '💡 The entire arbitration process usually takes 45-60 days'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}