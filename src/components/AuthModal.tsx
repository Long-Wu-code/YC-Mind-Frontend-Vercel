import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onSignUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  onResetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  onSignUp,
  onResetPassword,
  loading,
  error
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setLocalError('请输入邮箱地址');
      return;
    }

    if (mode === 'reset') {
      const result = await onResetPassword(email);
      if (result.success) {
        setSuccessMessage('密码重置邮件已发送，请查收邮箱');
        setMode('signin');
      } else {
        setLocalError(result.error || '重置密码失败');
      }
      return;
    }

    if (!password.trim()) {
      setLocalError('请输入密码');
      return;
    }

    if (password.length < 6) {
      setLocalError('密码至少需要6个字符');
      return;
    }

    if (mode === 'signup') {
      const result = await onSignUp(email, password, fullName);
      if (result.success) {
        setSuccessMessage('注册成功！请查收邮箱验证邮件');
        setMode('signin');
      } else {
        setLocalError(result.error || '注册失败');
      }
    } else {
      const result = await onSignIn(email, password);
      if (result.success) {
        onClose();
      } else {
        setLocalError(result.error || '登录失败');
      }
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setLocalError(null);
    setSuccessMessage(null);
    setShowPassword(false);
  };

  const switchMode = (newMode: 'signin' | 'signup' | 'reset') => {
    setMode(newMode);
    resetForm();
  };

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Sign Up'}
            {mode === 'reset' && 'Reset Password'}
          </h2>
          <p className="text-gray-600 mt-2">
            {mode === 'signin' && 'Welcome back to YC Mind'}
            {mode === 'signup' && 'Join YC Mind today'}
            {mode === 'reset' && 'Enter your email to reset password'}
          </p>
        </div>

        {displayError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{displayError}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm">{successMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {mode === 'signin' && 'Sign In'}
                {mode === 'signup' && 'Sign Up'}
                {mode === 'reset' && 'Send Reset Email'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          {mode === 'signin' && (
            <>
              <button
                onClick={() => switchMode('reset')}
                className="text-orange-600 hover:text-orange-700 text-sm"
              >
                Forgot your password?
              </button>
              <div className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="text-orange-600 hover:text-orange-700 font-medium"
                >
                  Sign up
                </button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div className="text-gray-600 text-sm">
              Already have an account?{' '}
              <button
                onClick={() => switchMode('signin')}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Sign in
              </button>
            </div>
          )}

          {mode === 'reset' && (
            <div className="text-gray-600 text-sm">
              Remember your password?{' '}
              <button
                onClick={() => switchMode('signin')}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Sign in
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Guest Mode
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default AuthModal;