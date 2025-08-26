import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatArea from './components/ChatArea';
import ChatInput from './components/ChatInput';
import LoginPrompt from './components/LoginPrompt';
import AuthModal from './components/AuthModal';
import { User, Message, ChatSession } from './types';
import { useDify } from './hooks/useDify';
import { useAuth } from './hooks/useAuth';
import DifyApiService from './services/difyApi';
import { difyConfig, validateDifyConfig, getConfigDebugInfo } from './config/dify';
import { validateSupabaseConfig, supabase } from './config/supabase';

function App() {
  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  
  // Auth state
  const { user, loading: authLoading, error: authError, signInWithEmail, signUpWithEmail, signOut, resetPassword } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{id: string; name: string; size: number} | null>(null);

  // Dify集成
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const streamingMessageIdRef = useRef<string | null>(null);

  const { uploadFile: uploadDifyFile, sendMessage: sendDifyMessage, isLoading: isDifyLoading, error: difyError, abortRequest, getCurrentResponse } = useDify({
    onMessage: (chunk: string) => {
      console.log('=== App onMessage callback ===');
      console.log('Received chunk:', JSON.stringify(chunk));
      console.log('Chunk length:', chunk.length);
      console.log('Current streamingMessageId:', streamingMessageIdRef.current);
      
      setMessages(prev => {
        console.log('=== Updating messages ===');
        console.log('Previous messages count:', prev.length);
        console.log('Looking for message with ID:', streamingMessageIdRef.current);
        
        const updatedMessages = prev.map(msg => {
          console.log('Checking message:', msg.id, 'vs', streamingMessageIdRef.current);
          if (msg.id === streamingMessageIdRef.current) {
            // 如果chunk为空字符串，清空内容；否则追加
            // 使用更可靠的方法处理内容，避免字符丢失
            const newContent = chunk === '' ? '' : msg.content + chunk;
            // 确保内容更新是同步的，避免竞态条件
            if (chunk !== '' && newContent.length === msg.content.length) {
              console.warn('Warning: Content length did not increase after adding chunk');
            }
            const updatedMsg = { ...msg, content: newContent };
            console.log('Found matching message!');
            console.log('Old content length:', msg.content.length);
            console.log('Chunk to add:', JSON.stringify(chunk));
            console.log('New content:', JSON.stringify(newContent));
            console.log('New content length:', newContent.length);
            return updatedMsg;
          }
          return msg;
        });
        
        console.log('Updated messages array length:', updatedMessages.length);
        return updatedMessages;
      });
    },
    onStreamStart: () => {
      console.log('=== App onStreamStart ===');
      setIsStreaming(true);
      
      // 创建流式消息
      const streamingId = 'streaming-' + Date.now();
      console.log('Creating streaming message with ID:', streamingId);
      setStreamingMessageId(streamingId);
      streamingMessageIdRef.current = streamingId;
      
      const streamingMessage: Message = {
        id: streamingId,
        content: '',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      
      console.log('Adding streaming message to messages array:', streamingMessage);
      
      setMessages(prev => [...prev, streamingMessage]);
    },
    onStreamEnd: () => {
      console.log('Stream ended');
      setIsStreaming(false);
      
      // 将流式消息转换为正式消息并保存
      console.log('Converting streaming message to final message');
      console.log('streamingMessageId:', streamingMessageIdRef.current, 'currentSessionId:', currentSessionId);
      if (streamingMessageIdRef.current && currentSessionId) {
        setMessages(prev => {
          const updatedMessages = prev.map(msg => {
            if (msg.id === streamingMessageIdRef.current) {
              const finalMessage: Message = {
                ...msg,
                id: Date.now().toString(),
                timestamp: new Date()
              };
              
              // 保存到会话历史
              if (finalMessage.content.trim()) {
                updateChatSession(currentSessionId, [finalMessage], finalMessage.content);
              }
              
              return finalMessage;
            }
            return msg;
          });
          return updatedMessages;
        });
      }
      
      // 清理流式状态
      setStreamingMessageId(null);
      streamingMessageIdRef.current = null;
    },
    onError: (error: Error) => {
      console.error('Dify streaming error:', error);
      setIsStreaming(false);
      setStreamingMessageId(null);
      streamingMessageIdRef.current = null;
    }
  });


  // Load user data and chat sessions from localStorage on mount
  useEffect(() => {
    // 验证 Supabase 配置
    validateSupabaseConfig();
    
    // 验证 Dify 配置
    const isConfigValid = validateDifyConfig();
    if (!isConfigValid) {
      console.error('❌ Dify 配置验证失败，聊天功能将无法正常工作');
      console.error('请检查 .env 文件中的配置项');
    } else {
      console.log('✅ Dify 配置验证成功，可以正常使用聊天功能');
    }
    
    // 输出配置调试信息
    const debugInfo = getConfigDebugInfo();
    console.log('=== Dify 配置调试信息 ===');
    console.table(debugInfo);
    
    const savedSessions = localStorage.getItem('ycmind_sessions');
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions);
      // Convert timestamp strings back to Date objects
      const sessionsWithDates = sessions.map((session: ChatSession) => ({
        ...session,
        timestamp: new Date(session.timestamp),
        messages: session.messages?.map((message: Message) => ({
          ...message,
          timestamp: new Date(message.timestamp)
        })) || []
      }));
      setChatSessions(sessionsWithDates);
    }
  }, []);

  // Save chat sessions to localStorage whenever they change
  useEffect(() => {
    if (user && chatSessions.length > 0) {
      localStorage.setItem('ycmind_sessions', JSON.stringify(chatSessions));
    }
  }, [chatSessions, user]);

  // Handle auth modal
  const handleShowAuth = () => {
    setShowAuthModal(true);
    setShowLoginPrompt(false);
  };

  const handleCloseAuth = () => {
    setShowAuthModal(false);
  };

  // Handle Supabase connection
  const handleSupabaseConnect = () => {
    // 打开Supabase设置页面
    window.open('https://supabase.com/dashboard/projects', '_blank');
    alert('请在Supabase控制台中:\n1. 创建新项目或选择现有项目\n2. 复制项目URL和anon key\n3. 更新.env文件中的VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY\n4. 重新启动应用');
  };

  // Handle logout  
  const handleLogout = async () => {
    // Always clear local data regardless of signOut result
    setChatSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
    setUploadedFile(null);
    localStorage.removeItem('ycmind_sessions');
    
    // Attempt to sign out from Supabase
    const result = await signOut();
    
    // Log any issues but don't prevent logout
    if (!result.success) {
      console.warn('Logout completed locally despite server error:', result.error);
    }
  };

  // Handle guest login (fallback)
  const handleGuestLogin = () => {
    setChatSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
    setShowLoginPrompt(false);
    setShowAuthModal(false);
  };

  // Send message
  const handleSendMessage = async (userInput: string) => {
    console.log('=== 开始发送消息 ===');
    console.log('用户输入:', userInput);
    console.log('上传文件:', uploadedFile);
    console.log('当前用户:', user?.name);
    console.log('当前会话ID:', currentSessionId);
    console.log('当前消息数量:', messages.length);
    
    if (!user) {
      console.log('用户未登录，无法发送消息');
      return;
    }
    
    if (!userInput.trim() && !uploadedFile) {
      console.log('没有输入内容或文件，无法发送');
      return;
    }
    
    // Ensure we always have a non-empty query for Dify API
    const query = userInput.trim() || (uploadedFile ? 'Analyze this resume' : '');
    
    if (!query) {
      console.log('查询内容为空，无法发送');
      return;
    }
    
    console.log('最终发送的查询内容:', query);
    
    // 如果没有当前会话，先创建一个
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        lastMessage: 'Starting conversation...',
        timestamp: new Date(),
        messages: [],
        conversationId: undefined
      };
      
      setChatSessions(prev => [newSession, ...prev]);
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
      console.log('创建新会话，ID:', sessionId);
    }

    // 创建消息数组，分别处理文件和文本
    const messagesToAdd: Message[] = [];
    let combinedQuery = '';
    
    // 如果有文件，先创建文件消息
    if (uploadedFile) {
      const fileMessage: Message = {
        id: Date.now().toString(),
        content: 'Please analyze this resume',
        sender: 'user',
        timestamp: new Date(),
        type: 'file',
        fileName: uploadedFile.name
      };
      messagesToAdd.push(fileMessage);
      // 确保文件信息在查询中被明确标记
      combinedQuery += 'I have attached my resume for analysis. ';
    }
    
    // 如果有文本输入，创建文本消息
    if (userInput.trim()) {
      const textMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: userInput.trim(),
        sender: 'user',
        timestamp: new Date(),
        type: 'text'
      };
      messagesToAdd.push(textMessage);
      combinedQuery += userInput.trim();
    } else if (uploadedFile) {
      // 如果只有文件没有文本输入，添加默认提示
      combinedQuery += 'Please analyze my resume and provide feedback.';
    }
    
    // 如果既没有文件也没有文本，返回
    if (messagesToAdd.length === 0) {
      return;
    }

    console.log('创建的用户消息:', messagesToAdd.length, '条');
    console.log('发送给 API 的组合查询:', combinedQuery);

    // 立即添加所有用户消息到界面
    setMessages(prev => {
      return [...prev, ...messagesToAdd];
    });

    try {
      // 获取当前会话的Dify conversation ID
      const currentSession = chatSessions.find(s => s.id === sessionId);
      const conversationId = currentSession?.conversationId;
      console.log('使用的 Dify 会话ID:', conversationId || '新会话');

      // 发送组合消息到 Dify，包含文件信息（如果有）
      console.log('=== 准备发送消息到 Dify ===');
      console.log('上传的文件:', uploadedFile);
      
      const filesToSend = uploadedFile ? [uploadedFile] : [];
      console.log('将要发送的文件列表:', filesToSend);
      
      const response = await sendDifyMessage(
        combinedQuery,
        conversationId,
        true,
        filesToSend
      );
      
      // 如果是新会话，保存Dify返回的conversation_id
      if (!conversationId && response && typeof response === 'object' && 'conversation_id' in response) {
        console.log('保存新的 Dify 会话ID:', response.conversation_id);
        setChatSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, conversationId: response.conversation_id }
            : session
        ));
      }
      
      // 更新会话记录中的所有用户消息
      const lastMessage = messagesToAdd[messagesToAdd.length - 1].content;
      updateChatSession(sessionId, messagesToAdd, lastMessage);
      
      // 发送成功后立即清空已上传的简历信息
      console.log('准备清空上传文件状态');
      setUploadedFile(null);
      console.log('已清空上传文件状态，uploadedFile:', null);
      
      // 强制更新UI，确保文件显示框立即消失
      setTimeout(() => {
        console.log('延迟检查上传文件状态:', uploadedFile);
      }, 100);
    } catch (error) {
      // 如果是用户主动中断，不显示错误消息
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('用户中断了请求');
        return;
      }
      
      console.error('=== 发送消息失败 ===');
      console.error('错误信息:', error);
      
      // 特殊处理API密钥错误
      if (error instanceof Error && (error.message.includes('403') || error.message.includes('API Key 验证失败'))) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: '❌ API 配置错误：请检查 .env 文件中的 VITE_DIFY_API_KEY 是否正确。\n\n请确保：\n1. API Key 以 "app-" 开头\n2. API Key 来自已发布的 Dify 应用\n3. 应用已启用 API 访问权限\n4. 网络连接正常',
          sender: 'ai',
          timestamp: new Date(),
          type: 'text'
        };
        
        setMessages(prev => [...prev, errorMessage]);
        updateChatSession(sessionId, [...messagesToAdd, errorMessage], errorMessage.content);
        return;
      }
      
      // 显示错误消息
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: uploadedFile ? '抱歉，文件分析失败。请检查文件格式并重试。' : '抱歉，我现在无法回复您的消息。请稍后再试。',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      updateChatSession(sessionId, [...messagesToAdd, errorMessage], errorMessage.content);
      
      // 即使出错也要清空上传文件状态
      if (uploadedFile) {
        console.log('发送失败，清空上传文件状态');
        setUploadedFile(null);
      }
    }
  };

  // Upload resume
  const handleUploadFile = async (file: File) => {
    console.log('=== handleUploadResume START ===');
    console.log('File:', file.name, file.size);

    if (!user) {
      console.log('User not authenticated, cannot upload resume');
      return;
    }

    try {
      // 上传简历到Dify
      console.log('=== APP FILE UPLOAD START ===');
      console.log('File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      const uploadResult = await uploadDifyFile(file);
      console.log('=== APP UPLOAD RESULT ===');
      console.log('Upload result:', uploadResult);

      // 验证上传结果
      if (!uploadResult || !uploadResult.id) {
        console.error('Upload validation failed:', uploadResult);
        throw new Error('文件上传失败：未获取到有效的文件ID');
      }

      // 保存上传的简历信息到状态
      const fileInfo = {
        id: uploadResult.id,
        name: uploadResult.name,
        size: uploadResult.size || file.size || 0
      };
      
      // 添加更多日志以调试文件ID
      console.log('=== 文件上传成功 ===');
      console.log('文件ID:', fileInfo.id);
      console.log('文件名:', fileInfo.name);
      console.log('文件大小:', fileInfo.size);
      
      // 验证文件ID是否有效
      if (!fileInfo.id || fileInfo.id === 'undefined' || fileInfo.id === 'null') {
        console.error('文件ID无效:', fileInfo.id);
        throw new Error('文件上传失败：获取的文件ID无效');
      }

      console.log('=== APP FILE INFO ===');
      console.log('Setting uploaded file info:', fileInfo);
      setUploadedFile(fileInfo);

      console.log('Resume saved to state:', uploadResult);
    } catch (error) {
      console.error('简历上传失败:', error);
      throw error;
    }
  };

  // Upload LinkedIn profile
  const handleUploadLinkedin = async (url: string, userMessage: string) => {
    if (!user) {
      console.log('User not authenticated, cannot upload LinkedIn');
      return;
    }
    
    // 如果没有当前会话，先创建一个
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Chat',
        lastMessage: 'Starting conversation...',
        timestamp: new Date(),
        messages: [],
        conversationId: undefined
      };
      
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
    }

    // 创建包含LinkedIn URL的用户消息
    const linkedinMessage: Message = {
      id: Date.now().toString(),
      content: userMessage,
      sender: 'user',
      timestamp: new Date(),
      type: 'linkedin',
      linkedinUrl: url
    };

    // 立即添加LinkedIn消息到界面
    setMessages(prev => [...prev, linkedinMessage]);

    try {
      // 发送LinkedIn分析请求，包含URL信息
      const analysisPrompt = `${userMessage}\n\nLinkedIn Profile URL: ${url}`;
      
      const currentSession = chatSessions.find(s => s.id === sessionId);
      const conversationId = currentSession?.conversationId;
      
      // 使用流式输出发送LinkedIn分析请求
      const response = await sendDifyMessage(analysisPrompt, conversationId, true);
      
      // 如果是新会话，保存Dify返回的conversation_id
      if (!conversationId && response && typeof response === 'object' && 'conversation_id' in response) {
        setChatSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, conversationId: response.conversation_id }
            : session
        ));
      }
      
      const lastMessage = userMessage;
      updateChatSession(sessionId, [linkedinMessage], userMessage);
    } catch (error) {
      // 如果是用户主动中断，不显示错误消息
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      
      console.error('LinkedIn分析失败:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: '抱歉，LinkedIn档案分析失败。请检查链接是否有效并重试。',
        sender: 'ai',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      updateChatSession(sessionId, [linkedinMessage, errorMessage], errorMessage.content);
    }
  };

  // Update or create chat session
  const updateChatSession = (sessionId: string, newMessages: Message[], lastMessage: string) => {
    setChatSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const allMessages = [...(session.messages || []), ...newMessages];
        
        // 如果是新会话且有了第一条消息，更新标题
        const sessionTitle = session.title === 'New Chat' && allMessages.length > 0
          ? (allMessages[0].type === 'file' 
              ? `Resume: ${allMessages[0].fileName}` 
              : allMessages[0].type === 'linkedin'
                ? 'LinkedIn Profile Analysis'
                : allMessages[0].content.slice(0, 30) + '...')
          : session.title;
          
        return { 
          ...session, 
          title: sessionTitle,
          lastMessage: lastMessage.slice(0, 50) + '...',
          timestamp: new Date(),
          messages: allMessages
        };
      }
      return session;
    }));
  };

  // New chat
  const handleNewChat = () => {
    if (!user) return;
    
    // 如果当前对话界面没有任何内容，不创建新会话
    if (messages.length === 0) {
      return;
    }
    
    // 如果当前有会话，先保存当前会话状态
    if (currentSessionId) {
      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...messages]
          };
        }
        return session;
      }));
    }
    
    // 创建新的空会话
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      lastMessage: 'Starting conversation...',
      timestamp: new Date(),
      messages: [],
      conversationId: undefined
    };
    
    // 创建新会话
    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
  };

  // Select chat session
  const handleSessionSelect = (id: string) => {
    // 如果当前有会话且有消息，先保存当前会话状态
    if (currentSessionId && messages.length > 0) {
      setChatSessions(prev => prev.map(session => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: [...messages]
          };
        }
        return session;
      }));
    }
    
    // 切换到选中的会话
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setCurrentSessionId(id);
      setMessages([...(session.messages || [])]);
    }
  };

  // Delete chat session
  const handleDeleteSession = (id: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== id));
    if (currentSessionId === id) {
      setMessages([]);
      setCurrentSessionId(null);
    }
  };

  // Show login prompt
  const handleShowLoginPrompt = () => {
    setShowAuthModal(true);
  };

  // 中断当前会话
  const handleAbortRequest = () => {
    console.log('=== handleAbortRequest called ===');
    console.log('isStreaming:', isStreaming);
    
    if (!isStreaming) {
      console.log('Not streaming, ignoring abort request');
      return;
    }
    
    console.log('Calling abortRequest...');
    abortRequest();
    console.log('abortRequest called');
    
    // 立即重置流式状态，确保按钮状态正确更新
    setIsStreaming(false);
  };
  
  // 清理流式状态
  useEffect(() => {
    if (!isStreaming) {
      setStreamingMessageId(null);
    }
  }, [isStreaming]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Sidebar */}
      <Sidebar
        isExpanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(!sidebarExpanded)}
        chatSessions={chatSessions}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        isAuthenticated={!!user}
      />

      {/* Header */}
      <Header
        user={user}
        onLogin={handleShowAuth}
        onLogout={handleLogout}
        sidebarExpanded={sidebarExpanded}
        onSupabaseConnect={handleSupabaseConnect}
      />

      {/* Chat Area */}
      <ChatArea
        messages={messages}
        sidebarExpanded={sidebarExpanded}
        isAuthenticated={!!user}
        isStreaming={isStreaming}
        streamingMessageId={streamingMessageId}
      />

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onUploadFile={handleUploadFile}
        onUploadLinkedin={handleUploadLinkedin}
        onAbortRequest={handleAbortRequest}
        sidebarExpanded={sidebarExpanded}
        isAuthenticated={!!user}
        onShowLoginPrompt={handleShowLoginPrompt}
        isLoading={isDifyLoading || isStreaming}
        isStreaming={isStreaming}
        uploadedFile={uploadedFile}
        onRemoveFile={() => setUploadedFile(null)}
      />

      {/* Login Prompt */}
      {showLoginPrompt && (
        <LoginPrompt
          onLogin={handleShowAuth}
          onClose={() => setShowLoginPrompt(false)}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={handleCloseAuth}
          onSignIn={signInWithEmail}
          onSignUp={signUpWithEmail}
          onResetPassword={resetPassword}
          loading={authLoading}
          error={authError}
        />
      )}

      {/* Dify错误提示 */}
      {difyError && (
        <div className="fixed top-20 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span className="font-medium">连接错误:</span>
            <span>{difyError}</span>
          </div>
        </div>
      )}

      {/* Supabase错误提示 */}
      {authError && (
        <div className="fixed top-32 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span className="font-medium">认证错误:</span>
            <span>{authError}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;