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

      <div className={`fixed left-0 top-0 h-full bg-white/90 backdrop-blur-sm border-r border-gray-200/50 transition-all duration-300 z-20 ${
        isExpanded ? 'w-80 md:w-80 w-full' : 'w-16'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/50">
            {isExpanded && (
              <button 
                onClick={onNewChat}
                disabled={!isAuthenticated}
                className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors text-sm md:text-base ${
                  isAuthenticated 
                    ? 'bg-orange-50 hover:bg-orange-100 text-orange-600' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Plus size={16} />
                <span className="font-medium">New Chat</span>
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors md:relative absolute right-4 top-4 z-30"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-3 p-3 hover:bg-gray-100/50 rounded-lg cursor-pointer transition-colors">
                <MessageSquare size={20} className="text-gray-600 flex-shrink-0" />
                {isExpanded && <span className="text-gray-700 font-medium">Chat History</span>}
              </div>

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
                        <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
                        <p>No chat history yet</p>
                        <p className="text-xs mt-1">Start a conversation to see it here</p>
                      </div>
                    ) : (
                      chatSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => onSessionSelect(session.id)}
                          className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                            currentSessionId === session.id 
                              ? 'bg-orange-50 border border-orange-200' 
                              : 'hover:bg-gray-100/50'
                          }`}
                        >
                          <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-700 truncate">
                              {session.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {session.lastMessage}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleDeleteClick(e, session.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                              title="Delete chat"
                            >
                              <Trash2 size={12} className="text-red-500" />
                            </button>
                            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
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
          <div className="p-4 space-y-2 border-t border-gray-200/50">
            <div className="flex items-center gap-3 p-3 hover:bg-gray-100/50 rounded-lg cursor-pointer transition-colors">
              <Settings size={20} className="text-gray-600 flex-shrink-0" />
              {isExpanded && <span className="text-gray-700">Settings</span>}
            </div>
            
            <div className="flex items-center gap-3 p-3 hover:bg-gray-100/50 rounded-lg cursor-pointer transition-colors">
              <HelpCircle size={20} className="text-gray-600 flex-shrink-0" />
              {isExpanded && <span className="text-gray-700">Help</span>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;