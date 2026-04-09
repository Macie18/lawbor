import { Outlet, useParams, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, MessageSquare, ChevronLeft, LayoutDashboard, FileText, Calculator, BookOpen, Gavel, Heart, Globe, Video, Sparkles } from 'lucide-react';
import { IDENTITIES } from '../types';
import AIChat from './AIChat';
import FirstVisitGuide from './FirstVisitGuide';
import { useTranslation } from '../contexts/TranslationContext';
import { useAIChat } from '../contexts/AIChatContext';
import { cn } from '../lib/utils';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, setLanguage } = useTranslation();
  const { setIsOpen } = useAIChat();

  const navItems = [
    { path: `/dashboard`, label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: `/contract`, label: t('nav.contract'), icon: FileText },
    { path: `/tax`, label: t('nav.tax'), icon: Calculator },
    { path: `/knowledge`, label: t('nav.knowledge'), icon: BookOpen },
    { path: `/arbitration`, label: t('nav.arbitration'), icon: Gavel },
    { path: `/benefits`, label: t('nav.benefits'), icon: Heart },
    { path: `/interview`, label: t('nav.interview'), icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 hover:bg-slate-100 lg:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 font-bold text-blue-600">
              <span className="text-sm font-medium text-slate-400 sm:inline-block">
                托起你的职场第一步
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* AI助手按钮 */}
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{language === 'zh' ? 'AI助手' : 'AI Assistant'}</span>
              <Sparkles className="h-4 w-4 sm:hidden" />
            </button>

            {/* 语言切换 */}
            <button
              onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <Globe className="h-4 w-4" />
              {language === 'zh' ? 'English' : '中文'}
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Bar */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <AIChat />
      <FirstVisitGuide />
    </div>
  );
}
