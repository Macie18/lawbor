import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Calculator, BookOpen, Gavel, Heart, ChevronRight, Video, MessageSquare } from 'lucide-react';
import { IDENTITIES } from '../types';
import { useTranslation } from '../contexts/TranslationContext';

export default function Dashboard() {
  const { t, language } = useTranslation();

  const modules = [
    {
      id: 'contract',
      title: t('nav.contract'),
      description: t('contract.desc'),
      icon: FileText,
      color: 'bg-indigo-500',
      path: '/contract',
    },
    {
      id: 'interview',
      title: language === 'zh' ? '1v1 模拟面试' : '1v1 Mock Interview',
      description: language === 'zh' 
        ? '针对校招、社招等不同场景，提供沉浸式 AI 模拟面试体验，实时反馈表现。' 
        : 'Provide immersive AI mock interview experiences for various scenarios with real-time feedback.',
      icon: MessageSquare,
      color: 'bg-violet-500',
      path: '/interview',
    },
    {
      id: 'tax',
      title: t('nav.tax'),
      description: t('tax.desc'),
      icon: Calculator,
      color: 'bg-emerald-500',
      path: '/tax',
    },
    {
      id: 'knowledge',
      title: t('nav.knowledge'),
      description: t('knowledge.desc'),
      icon: BookOpen,
      color: 'bg-amber-500',
      path: '/knowledge',
    },
    {
      id: 'arbitration',
      title: t('nav.arbitration'),
      description: t('arbitration.desc'),
      icon: Gavel,
      color: 'bg-rose-500',
      path: '/arbitration',
    },
    {
      id: 'benefits',
      title: t('nav.benefits'),
      description: t('benefits.desc'),
      icon: Heart,
      color: 'bg-pink-500',
      path: '/benefits',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-12">
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-2 text-3xl font-bold text-slate-900"
        >
          {t('dashboard.welcome')}
        </motion.h2>
        <p className="text-lg text-slate-500">
          Lawbor 为你提供全方位的职场支持，点击下方模块开始探索。
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={module.path}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-50"
            >
              <div className="p-8">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${module.color} text-white shadow-lg transition-transform group-hover:scale-110`}>
                  <module.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-slate-900">{module.title}</h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-500">
                  {module.description}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-600">{t('dashboard.start')}</span>
                  <ChevronRight className="h-5 w-5 text-blue-600 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
