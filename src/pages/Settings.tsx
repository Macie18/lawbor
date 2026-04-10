import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { 
  User, 
  Mail, 
  Shield, 
  History, 
  FileText, 
  Calculator, 
  ArrowLeft,
  LogOut,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {language === 'zh' ? '返回' : 'Back'}
      </button>

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          {language === 'zh' ? '账户设置' : 'Account Settings'}
        </h1>
        <p className="mt-2 text-slate-500">
          {language === 'zh' ? '管理您的账户信息和数据' : 'Manage your account and data'}
        </p>
      </div>

      {/* 用户信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.email?.split('@')[0]}</h2>
            <p className="flex items-center gap-2 text-blue-100">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-blue-100">
          <Calendar className="h-4 w-4" />
          {language === 'zh' ? '注册时间：' : 'Joined: '}
          {new Date(user.created_at || Date.now()).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
        </div>
      </motion.div>

      {/* 设置选项 */}
      <div className="space-y-4">
        {/* 安全设置 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
              <Shield className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {language === 'zh' ? '安全设置' : 'Security Settings'}
              </h3>
              <p className="text-sm text-gray-500">
                {language === 'zh' ? '修改密码、两步验证等' : 'Change password, 2FA, etc.'}
              </p>
            </div>
            <button className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors">
              {language === 'zh' ? '管理' : 'Manage'}
            </button>
          </div>
        </motion.div>

        {/* 数据统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gray-200 bg-white p-5"
        >
          <div className="mb-4 flex items-center gap-3">
            <History className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">
              {language === 'zh' ? '您的数据' : 'Your Data'}
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <FileText className="mx-auto h-6 w-6 text-blue-600" />
              <p className="mt-2 text-2xl font-bold text-blue-600">-</p>
              <p className="text-xs text-gray-500">
                {language === 'zh' ? '合同审查' : 'Reviews'}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <Calculator className="mx-auto h-6 w-6 text-green-600" />
              <p className="mt-2 text-2xl font-bold text-green-600">-</p>
              <p className="text-xs text-gray-500">
                {language === 'zh' ? '税务计算' : 'Calculations'}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <History className="mx-auto h-6 w-6 text-purple-600" />
              <p className="mt-2 text-2xl font-bold text-purple-600">-</p>
              <p className="text-xs text-gray-500">
                {language === 'zh' ? '对话历史' : 'Chats'}
              </p>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-gray-400">
            {language === 'zh' 
              ? '数据统计功能开发中，敬请期待' 
              : 'Statistics coming soon'}
          </p>
        </motion.div>

        {/* 退出登录 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-red-200 bg-white p-5"
        >
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 py-3 font-semibold text-white hover:bg-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {language === 'zh' ? '退出登录' : 'Sign Out'}
          </button>
        </motion.div>
      </div>

      {/* 底部说明 */}
      <p className="mt-8 text-center text-xs text-gray-400">
        {language === 'zh' 
          ? '如有问题，请联系 support@lawbor.com' 
          : 'Questions? Contact support@lawbor.com'}
      </p>
    </div>
  );
};

export default Settings;