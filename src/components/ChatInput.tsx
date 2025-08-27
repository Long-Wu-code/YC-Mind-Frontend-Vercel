import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Linkedin, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onUploadFile: (file: File) => void;
  onUploadLinkedin: (url: string, userMessage?: string) => void;
  onAbortRequest: () => void;
  sidebarExpanded: boolean;
  isAuthenticated: boolean;
  onShowLoginPrompt: () => void;
  isLoading: boolean;
  isStreaming: boolean;
  uploadedFile: {id: string; name: string; size: number} | null;
  onRemoveFile: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onUploadFile,
  onUploadLinkedin,
  onAbortRequest,
  sidebarExpanded,
  isAuthenticated,
  onShowLoginPrompt,
  isLoading,
  isStreaming,
  uploadedFile,
  onRemoveFile
}) => {
  const [message, setMessage] = useState('');
  const [showLinkedinInput, setShowLinkedinInput] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [savedLinkedinUrl, setSavedLinkedinUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整 textarea 高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 120; // 最大高度 120px
      const minHeight = 24; // 最小高度 24px
      textarea.style.height = Math.min(Math.max(scrollHeight, minHeight), maxHeight) + 'px';
    }
  };

  // 当消息内容改变时调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onShowLoginPrompt();
      return;
    }
    if ((message.trim() || savedLinkedinUrl || uploadedFile) && !isLoading) {
      if (savedLinkedinUrl) {
        // 如果有保存的LinkedIn URL，调用LinkedIn处理函数
        onUploadLinkedin(savedLinkedinUrl, message.trim() || 'Please analyze my LinkedIn profile');
        setSavedLinkedinUrl(''); // 发送后清除保存的URL
      } else {
        // 发送消息（可能包含文件）
        // 确保上传的文件信息被正确传递和处理
        onSendMessage(message);
        
        // 如果有上传的文件，立即清除本地文件状态
        // 这是为了确保UI立即响应，即使父组件的状态更新可能稍有延迟
        if (uploadedFile) {
          console.log('ChatInput: 检测到已上传文件，准备清除显示');
          // 通过调用onRemoveFile来确保文件显示框立即消失
          // 注意：这不会影响实际发送的文件，因为文件已经通过onSendMessage传递
          setTimeout(() => {
            console.log('ChatInput: 延迟清除文件显示');
            onRemoveFile();
          }, 50);
        }
      }
      setMessage('');
      // 重置 textarea 高度
      setTimeout(() => adjustTextareaHeight(), 0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!isAuthenticated) {
      onShowLoginPrompt();
      return;
    }
    if (file) {
      // 验证文件类型 - 只允许PDF格式的简历
      const allowedTypes = ['.pdf'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        alert('请上传PDF格式的简历文件');
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      try {
        // 上传简历到 Dify
        await onUploadFile(file);
      } catch (error) {
        console.error('简历上传失败:', error);
        alert('简历上传失败，请重试');
        // Reset file input on error
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLinkedinAdd = () => {
    if (!isAuthenticated) {
      onShowLoginPrompt();
      return;
    }
    
    // 验证是否为LinkedIn URL
    const trimmedUrl = linkedinUrl.trim();
    if (!trimmedUrl.includes('linkedin.com')) {
      alert('请输入有效的LinkedIn个人资料链接');
      return;
    }
    
    if (linkedinUrl.trim()) {
      // 保存LinkedIn URL到上方显示
      setSavedLinkedinUrl(linkedinUrl.trim());
      setLinkedinUrl('');
      setShowLinkedinInput(false);
    }
  };

  const handleLinkedinCancel = () => {
    setLinkedinUrl('');
    setShowLinkedinInput(false);
  };

  const handleRemoveLinkedin = () => {
    setSavedLinkedinUrl('');
  };


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: 允许换行，不发送消息
        return;
      } else {
        // Enter: 发送消息
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    // 限制最大字符数为 2000
    if (value.length <= 2000) {
      setMessage(value);
    }
  };

  return (
    <>
      <div className={`fixed bottom-0 right-0 transition-all duration-300 ease-in-out content-transform ${
        sidebarExpanded ? 'left-80' : 'left-16'
      }`}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Uploaded File Display */}
            {uploadedFile && (
              <div className="mb-3 bg-gray-50 rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                      <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                      </svg>
                    </div>
                    <span className="text-sm text-gray-900 font-medium">Resume</span>
                  </div>
                  <button
                    onClick={onRemoveFile}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-1 text-xs text-gray-700 truncate">
                  {uploadedFile.name}
                </div>
              </div>
            )}

            {/* Saved LinkedIn URL Display */}
            {savedLinkedinUrl && (
              <div className="mb-3 bg-blue-50 rounded-lg border border-blue-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-900 font-medium">LinkedIn Profile</span>
                  </div>
                  <button
                    onClick={handleRemoveLinkedin}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ×
                  </button>
                </div>
                <div className="mt-1 text-xs text-blue-700 truncate">
                  {savedLinkedinUrl}
                </div>
              </div>
            )}

            {/* LinkedIn Input */}
            {showLinkedinInput && (
              <div className="mb-4 bg-blue-50 rounded-xl border border-blue-200 p-3 max-w-md">
                <div className="flex items-center gap-2 mb-3">
                  <Linkedin className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Add LinkedIn Profile</h3>
                </div>
                
                <div className="space-y-2">
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                    autoFocus
                  />
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={handleLinkedinCancel}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLinkedinAdd}
                      disabled={!linkedinUrl.trim()}
                      className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input Container */}
            <div className={`bg-white rounded-2xl shadow-sm border transition-colors ${
              isFocused ? 'border-orange-300 shadow-md' : 'border-gray-200'
            }`}>
              {/* Input row */}
              <div className="flex items-start gap-3 px-4 py-3">
                {/* Input Field */}
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={
                      savedLinkedinUrl 
                        ? "Ask YC Mine about your LinkedIn profile... (Enter 发送, Shift+Enter 换行)" 
                        : uploadedFile 
                          ? "Ask YC Mine about your file... (Enter 发送, Shift+Enter 换行)" 
                          : "Ask YC Mine (Enter 发送, Shift+Enter 换行)"
                    }
                    disabled={isLoading}
                    className="w-full bg-transparent border-none outline-none resize-none text-gray-800 placeholder-gray-400 disabled:opacity-50 overflow-hidden"
                    rows={1}
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                  />
                </div>
                {/* 字符计数器 - 只在有内容时显示 */}
                {message.length > 0 && (
                  <div className="flex flex-col items-end justify-end pb-1">
                    <div className={`text-xs ${message.length > 1000 ? 'text-red-500' : 'text-gray-400'}`}>
                      {message.length}/2000
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom row with Resume and LinkedIn buttons */}
              <div className="flex items-center gap-4 px-4 pb-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-4">
                {/* Resume Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                    className={`flex items-center gap-2 transition-colors disabled:opacity-50 ${
                      uploadedFile
                        ? 'text-gray-800 hover:text-gray-900' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  title="Upload Resume"
                >
                  <Paperclip className="w-4 h-4" />
                  <span className="text-sm">Resume</span>
                </button>

                {/* LinkedIn Button */}
                <button
                  onClick={() => setShowLinkedinInput(true)}
                  disabled={isLoading}
                  className={`flex items-center gap-2 transition-colors disabled:opacity-50 ${
                      showLinkedinInput || savedLinkedinUrl
                      ? 'text-blue-600 hover:text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Analyze LinkedIn Profile"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm">LinkedIn</span>
                </button>
                </div>

                {/* Send/Stop Button */}
                <div className="ml-auto">
                  {isStreaming ? (
                    <button
                      onClick={onAbortRequest}
                      className="flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                      title="Stop generation"
                    >
                      <Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={(!message.trim() && !savedLinkedinUrl && !uploadedFile) || isLoading}
                      className="flex items-center justify-center w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                      title="Send message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />
    </>
  );
};

export default ChatInput;