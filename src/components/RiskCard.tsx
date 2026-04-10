import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import type { RiskAssessment, RiskLevel } from '../types/contractReview';
import { RiskLevelMap, RiskLevelColor, RiskCategoryMap } from '../types/contractReview';

interface RiskCardProps {
  risk: RiskAssessment;
  index: number;
}

export default function RiskCard({ risk, index }: RiskCardProps) {
  const { t, language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const cardId = `risk-${index}`;
  const levelColor = RiskLevelColor[risk.level];
  const levelText = RiskLevelMap[risk.level];
  const categoryText = RiskCategoryMap[risk.category] || risk.category;

  const handleCopy = () => {
    navigator.clipboard.writeText(risk.negotiation_tip).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const levelTextColor =
    risk.level === 'high'
      ? 'text-red-700'
      : risk.level === 'medium'
      ? 'text-amber-700'
      : risk.level === 'low'
      ? 'text-blue-700'
      : 'text-green-700';

  return (
    <motion.div
      key={cardId}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-2xl border-2 p-5 ${levelColor} mb-4`}
    >
      {/* 卡片头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium px-2 py-0.5 bg-white/60 rounded-full">
              {categoryText}
            </span>
            <span className={`text-sm font-bold ${levelTextColor}`}>
              {levelText}
            </span>
            <span className="text-xs text-slate-500">
              {language === 'zh' ? '评分' : 'Score'}: {risk.score}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 text-lg">{risk.title}</h4>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-600" />
          )}
        </button>
      </div>

      {/* 原始条款 */}
      <div className="mb-3">
        <p className="text-xs text-slate-500 mb-1">
          {language === 'zh' ? '原始条款' : 'Original Clause'}
        </p>
        <p className="text-sm text-slate-700 bg-white/50 rounded-lg p-3">
          {risk.original_clause}
        </p>
      </div>

      {/* 大白话解读 */}
      <div className="mb-3">
        <p className="text-xs text-slate-500 mb-1">
          {language === 'zh' ? '💡 大白话解读' : '💡 Explanation'}
        </p>
        <p className="text-sm text-slate-700">{risk.explanation}</p>
      </div>

      {/* 法律依据 */}
      {risk.legal_basis && (
        <div className="mb-3">
          <p className="text-xs text-slate-500 mb-1">
            {language === 'zh' ? '⚖️ 法律依据' : '⚖️ Legal Basis'}
          </p>
          <p className="text-sm text-slate-700 bg-blue-50/50 rounded-lg p-3">
            {risk.legal_basis}
          </p>
        </div>
      )}

      {/* 展开/收起谈判话术 */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="pt-3 border-t border-slate-200/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">
                {language === 'zh' ? '💬 谈判话术' : '💬 Negotiation Tip'}
              </p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3" />
                    {language === 'zh' ? '已复制' : 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    {language === 'zh' ? '复制' : 'Copy'}
                  </>
                )}
              </button>
            </div>
<p className="text-sm text-green-800 bg-green-50 rounded-lg p-3 whitespace-pre-wrap">
            {risk.negotiation_tip}
          </p>
          </div>
        </motion.div>
      )}

      {/* 未展开时显示点击提示 */}
      {!isExpanded && risk.negotiation_tip && (
        <div className="mt-3 pt-3 border-t border-slate-200/50">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-slate-400 italic hover:text-slate-600 transition-colors cursor-pointer"
          >
            {language === 'zh'
              ? '💬 点击展开查看谈判话术'
              : '💬 Click to view negotiation tip'}
          </button>
        </div>
      )}
    </motion.div>
  );
}