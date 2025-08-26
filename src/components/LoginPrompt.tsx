import React from 'react';
import { User, MessageSquare, FileText, Zap, Mail } from 'lucide-react';

interface LoginPromptProps {
  onLogin: () => void;
  onClose: () => void;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ onLogin, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <User size={32} className="text-orange-600" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          Sign in to YC Mine
        </h3>
        
        <p className="text-gray-600 mb-6">
          Join thousands of entrepreneurs and job seekers finding their next opportunity
        </p>

        <div className="space-y-3 mb-8 text-left">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <MessageSquare size={16} className="text-orange-600 flex-shrink-0" />
            <span>Save and access your conversation history</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <FileText size={16} className="text-orange-600 flex-shrink-0" />
            <span>Get personalized resume analysis and feedback</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Zap size={16} className="text-orange-600 flex-shrink-0" />
            <span>Receive tailored career recommendations</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            <Mail size={16} />
            邮箱登录/注册
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Guest Mode
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginPrompt;