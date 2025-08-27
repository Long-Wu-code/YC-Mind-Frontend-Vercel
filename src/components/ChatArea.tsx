import React, { useRef, useEffect } from 'react';
import { Bot, User, Linkedin, ExternalLink } from 'lucide-react';
import { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface ChatAreaProps {
  messages: Message[];
  sidebarExpanded: boolean;
  isAuthenticated: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string | null;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, sidebarExpanded, isAuthenticated, isStreaming, streamingMessageId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log('=== ChatArea RENDER ===');
  console.log('Messages count:', messages.length);
  console.log('Messages details:', messages.map(m => ({ 
    id: m.id, 
    sender: m.sender, 
    content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
    type: m.type 
  })));
  console.log('isAuthenticated:', isAuthenticated);
  console.log('isStreaming:', isStreaming);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (messages.length === 0) {
    return (
      <div className={`fixed top-16 bottom-32 right-0 transition-all duration-300 ease-in-out content-transform ${
        sidebarExpanded ? 'left-80' : 'left-16'
      }`}>
        <div className="h-full flex flex-col items-center justify-center px-4 md:px-6">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
              <Bot size={24} className="text-amber-600 md:w-8 md:h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2 md:mb-3">
              <span className="text-yc-brown">YC Mine</span>
            </h2>
            <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              Find Your Next Opportunity
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed top-16 bottom-32 right-0 transition-all duration-300 ease-in-out content-transform ${
      sidebarExpanded ? 'left-80' : 'left-16'
    }`}>
      <div className="h-full overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-3 md:space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 md:gap-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'ai' && (
                <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-white md:w-4 md:h-4" />
                </div>
              )}
              
              <div className={`max-w-xs md:max-w-2xl ${message.sender === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`rounded-2xl px-3 md:px-4 py-2 md:py-3 text-sm md:text-base ${
                    message.sender === 'user'
                      ? 'bg-orange-600 text-white ml-auto'
                      : 'bg-white border border-gray-200 shadow-sm'
                  }`}
                >
                  {message.type === 'file' ? (
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <svg width="12" height="12" className="md:w-4 md:h-4" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-xs md:text-sm truncate max-w-32 md:max-w-none">{message.fileName}</div>
                        <div className="text-xs opacity-75">Resume: {message.content}</div>
                      </div>
                    </div>
                  ) : message.type === 'linkedin' ? (
                    <div className="flex items-start gap-2 md:gap-3">
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        <Linkedin size={12} className="text-blue-600 md:w-4 md:h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium mb-1 md:mb-2 text-xs md:text-sm">LinkedIn Profile Analysis</div>
                        <div className="text-xs opacity-75 mb-1 md:mb-2 break-all">Profile: {message.linkedinUrl}</div>
                        <MarkdownRenderer content={message.content} />
                      </div>
                      <a
                        href={message.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                        title="Open LinkedIn profile"
                      >
                        <ExternalLink size={12} className="opacity-60 md:w-3.5 md:h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <MarkdownRenderer content={message.content} />
                  )}
                  
                  {/* 流式输入指示器 - 只在当前正在流式输出的消息上显示 */}
                  {message.id === streamingMessageId && isStreaming && (
                    <div className="flex items-center gap-1 mt-1 md:mt-2 opacity-70">
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  )}
                </div>
                
                {/* 时间戳 - 非流式消息或流式输出完成时显示 */}
                {!message.id.startsWith('streaming-') || !isStreaming ? (
                  <div className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                ) : null}
              </div>

              {message.sender === 'user' && (
                <div className="w-7 h-7 md:w-8 md:h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={14} className="text-white md:w-4 md:h-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;