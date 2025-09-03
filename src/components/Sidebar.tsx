import React, { useState } from 'react';
import { Menu, MessageSquare, FileText, Settings, HelpCircle, Plus, ChevronRight, Trash2 } from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
  chatSessions: ChatSession[];
  currentSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  isAuthenticated: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isExpanded, 
  onToggle, 
  chatSessions, 
  currentSessionId, 
  onSessionSelect,
  onNewChat,
  onDeleteSession,
  isAuthenticated
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeleteConfirm(sessionId);
  };

  const confirmDelete = (sessionId: string) => {
    onDeleteSession(sessionId);
    setDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  return (
    <>
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Delete Chat Session
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this chat session? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={onToggle}
        />
      )}
      
      <div className={`fixed left-0 top-0 h-full bg-white/90 backdrop-blur-sm border-r border-gray-200/50 z-20 transition-all duration-300 ease-in-out ${
        isExpanded 
          ? 'w-80 md:w-80' 
          : 'w-16 md:w-16'
      } ${
        isExpanded 
          ? 'translate-x-0' 
          : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`border-b border-gray-200/50 ${
            isExpanded ? 'p-3 md:p-4' : 'p-2'
          }`}>
            <div className={`flex ${isExpanded ? 'justify-between md:justify-end' : 'justify-center'}`}>
              {isExpanded && (
                <div className="md:hidden">
                  <h1 className="text-lg font-semibold text-gray-800">YC Mine</h1>
                </div>
              )}
              <button
                onClick={onToggle}
                className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className={`space-y-2 ${isExpanded ? 'p-3 md:p-4' : 'p-2'}`}>
              <button 
                onClick={onNewChat}
                disabled={!isAuthenticated}
                className={`flex items-center hover:bg-orange-100 rounded-lg transition-colors ${
                  isExpanded 
                    ? 'gap-3 p-3 md:p-3' 
                    : 'justify-center p-2 mx-1'
                } ${
                  isAuthenticated 
                    ? 'bg-orange-50 text-orange-600' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={20} className="flex-shrink-0" />
                {isExpanded && <span className="font-medium text-sm md:text-base">New Chat</span>}
              </button>

              {isExpanded && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Chats</h3>
                  </div>
                  <div className="space-y-1">
                      {!isAuthenticated ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          <p>Sign in to view your chat history</p>
                        </div>
                      ) : chatSessions.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-sm">
                          <p>No chat history yet</p>
                          <p className="text-xs mt-1">Start a conversation to see it here</p>
                        </div>
                      ) : (
                      chatSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => {
                            onSessionSelect(session.id);
                            // 在移动端选择会话后自动关闭侧边栏
                            if (window.innerWidth < 768) {
                              onToggle();
                            }
                          }}
                          className={`group flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg cursor-pointer transition-all ${
                            currentSessionId === session.id 
                              ? 'bg-orange-50 border border-orange-200' 
                              : 'hover:bg-gray-100/50'
                          }`}
                        >
                          <MessageSquare size={14} className="text-gray-400 flex-shrink-0 md:w-4 md:h-4" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs md:text-sm font-medium text-gray-700 truncate">
                              {session.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate hidden md:block">
                              {session.lastMessage}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleDeleteClick(e, session.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                              title="Delete chat"
                            >
                              <Trash2 size={10} className="text-red-500 md:w-3 md:h-3" />
                            </button>
                            <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-400 transition-colors md:w-3.5 md:h-3.5" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className={`border-t border-gray-200/50 ${
            isExpanded ? 'p-3 md:p-4 space-y-2' : 'py-2 px-1 space-y-1'
          }`}>
            <div className={`flex items-center hover:bg-gray-100/50 rounded-lg cursor-pointer transition-colors ${
              isExpanded 
                ? 'gap-3 p-2 md:p-3' 
                : 'justify-center p-2 mx-1'
            }`}>
              <Settings size={18} className="text-gray-600 flex-shrink-0 md:w-5 md:h-5" />
              {isExpanded && <span className="text-gray-700 text-sm md:text-base">Settings</span>}
            </div>
            
            <div className={`flex items-center hover:bg-gray-100/50 rounded-lg cursor-pointer transition-colors ${
              isExpanded 
                ? 'gap-3 p-2 md:p-3' 
                : 'justify-center p-2 mx-1'
            }`}>
              <HelpCircle size={18} className="text-gray-600 flex-shrink-0 md:w-5 md:h-5" />
              {isExpanded && <span className="text-gray-700 text-sm md:text-base">Help</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;