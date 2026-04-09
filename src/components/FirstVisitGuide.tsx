import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

const GUIDE_KEY = 'lawbor_first_visit_guide_shown';

export default function FirstVisitGuide() {
  const { language } = useTranslation();
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem(GUIDE_KEY);
    if (!hasSeenGuide) {
      // 延迟3秒显示,让用户先看到页面
      const timer = setTimeout(() => {
        setShowGuide(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setShowGuide(false);
    localStorage.setItem(GUIDE_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {showGuide && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* 引导卡片 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 right-6 z-[9999] w-80 rounded-2xl bg-white p-6 shadow-2xl"
          >
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 rounded-full p-1 hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>

            {/* 内容 */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg">
              <Sparkles className="h-6 w-6" />
            </div>

            <h3 className="mb-2 text-lg font-bold text-slate-900">
              {language === 'zh' ? '👋 欢迎使用 Lawbor!' : '👋 Welcome to Lawbor!'}
            </h3>

            <p className="mb-4 text-sm leading-relaxed text-slate-600">
              {language === 'zh'
                ? '右下角的蓝色按钮是我们的AI法律助手,随时为你解答劳动法律问题。点击知识卡片也可以直接咨询相关话题!'
                : 'The blue button in the bottom right corner is our AI legal assistant, ready to answer your labor law questions anytime. You can also click knowledge cards to consult about specific topics!'}
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {language === 'zh' ? '知道了' : 'Got it!'}
              </button>
            </div>

            {/* 指向右下角按钮的箭头 */}
            <div className="absolute -bottom-2 right-8 h-4 w-4 rotate-45 bg-white shadow-lg" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}