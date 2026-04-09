import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { signUp, signIn, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('两次密码输入不一致');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('密码长度至少为 6 位');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('注册成功!请查收邮箱验证邮件');
          setTimeout(() => {
            setMode('login');
          }, 2000);
        }
      } else if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        } else {
          onClose();
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setSuccess('密码重置邮件已发送,请查收邮箱');
        }
      }
    } catch (err) {
      setError('操作失败,请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* 标题 */}
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          {mode === 'login' && '登录账户'}
          {mode === 'register' && '注册账户'}
          {mode === 'forgot' && '重置密码'}
        </h2>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* 成功提示 */}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {success}
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              邮箱地址
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* 密码 */}
          {mode !== 'forgot' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
          )}

          {/* 确认密码(注册时) */}
          {mode === 'register' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 disabled:opacity-50"
          >
            {loading ? '处理中...' : mode === 'login' ? '登录' : mode === 'register' ? '注册' : '发送重置邮件'}
          </button>
        </form>

        {/* 切换模式 */}
        <div className="mt-6 space-y-2 text-center text-sm text-gray-600">
          {mode === 'login' && (
            <>
              <button
                onClick={() => setMode('forgot')}
                className="text-blue-600 hover:underline"
              >
                忘记密码?
              </button>
              <p>
                还没有账户?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  立即注册
                </button>
              </p>
            </>
          )}
          {mode === 'register' && (
            <p>
              已有账户?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-semibold text-blue-600 hover:underline"
              >
                立即登录
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <p>
              想起密码了?{' '}
              <button
                onClick={() => setMode('login')}
                className="font-semibold text-blue-600 hover:underline"
              >
                返回登录
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;