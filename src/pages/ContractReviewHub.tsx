/**
 * 合同审查母页面 - 选择入口
 * 
 * 功能：
 * 1. 【企业风险审查】- 手动输入企业名称查询
 * 2. 【我要验牌-合同审查】- 上传合同自动审查
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, FileSearch, Shield, Scale, ArrowRight } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

export default function ContractReviewHub() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const options = [
    {
      id: 'company-risk',
      title: language === 'zh' ? '企业风险审查' : 'Company Risk Review',
      description: language === 'zh' 
        ? '手动输入企业名称，查询工商信息、劳动纠纷、司法风险等'
        : 'Enter company name to query business info, labor disputes, judicial risks',
      icon: Building2,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50 hover:bg-violet-100',
      borderColor: 'border-violet-200',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      path: '/company-risk',
    },
    {
      id: 'contract-check',
      title: language === 'zh' ? '我要验牌-合同审查' : 'Contract Review',
      description: language === 'zh'
        ? '上传劳动合同，智能审查风险条款，自动提示企业风险'
        : 'Upload labor contract, intelligently review risky clauses, auto-detect company risks',
      icon: FileSearch,
      color: 'from-blue-500 to-cyan-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      path: '/contract-check',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-12 w-12 text-violet-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
              {language === 'zh' ? '合同审查中心' : 'Contract Review Center'}
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            {language === 'zh'
              ? '选择您的审查方式，保护您的劳动权益'
              : 'Choose your review method to protect your labor rights'}
          </p>
        </motion.div>

        {/* 选择卡片 */}
        <div className="grid md:grid-cols-2 gap-8">
          {options.map((option, index) => {
            const Icon = option.icon;
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(option.path)}
                className={`relative overflow-hidden rounded-3xl border-2 ${option.borderColor} ${option.bgColor} p-8 text-left transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group`}
              >
                {/* 背景渐变 */}
                <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                {/* 图标 */}
                <div className={`w-16 h-16 ${option.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={`h-8 w-8 ${option.iconColor}`} />
                </div>

                {/* 标题 */}
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  {option.title}
                </h2>

                {/* 描述 */}
                <p className="text-slate-600 mb-6 leading-relaxed">
                  {option.description}
                </p>

                {/* 功能列表 */}
                {option.id === 'company-risk' && (
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span>{language === 'zh' ? '工商基本信息' : 'Business Info'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span>{language === 'zh' ? '劳动纠纷记录' : 'Labor Disputes'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span>{language === 'zh' ? '司法风险提示' : 'Judicial Risks'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                      <span>{language === 'zh' ? '经营异常状态' : 'Business Abnormals'}</span>
                    </div>
                  </div>
                )}

                {option.id === 'contract-check' && (
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{language === 'zh' ? '合同条款风险审查' : 'Clause Risk Review'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{language === 'zh' ? '法律法规智能匹配' : 'Legal Basis Matching'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{language === 'zh' ? '企业风险自动提示' : 'Auto Company Risk Detection'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{language === 'zh' ? '谈判建议生成' : 'Negotiation Tips'}</span>
                    </div>
                  </div>
                )}

                {/* 箭头 */}
                <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  <ArrowRight className={`h-6 w-6 ${option.iconColor}`} />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* 底部提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur border border-slate-200 text-sm text-slate-500">
            <Scale className="h-4 w-4" />
            <span>
              {language === 'zh'
                ? 'Lawbor用心托举每一位职场新人'
                : 'Data: QCC · Legal Basis: Labor Law'}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}