import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, LogOut, Settings, UserCircle, Database } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  user: UserType | null;
  onLogin: () => void;
  onLogout: () => void;
  sidebarExpanded: boolean;
  onSupabaseConnect?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onLogin, 
  onLogout, 
  sidebarExpanded, 
  onSupabaseConnect 
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset menu state when user changes
  useEffect(() => {
    setShowUserMenu(false);
  }, [user]);

  // Check if Supabase is configured
  const isSupabaseConfigured = () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return url && key && 
           !url.includes('your-supabase-url-here') && 
           !key.includes('your-supabase-anon-key-here') &&
           url.length > 10 && key.length > 10;
  };

  return (
    <div className={`fixed top-0 right-0 h-14 md:h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200/50 z-10 transition-all duration-300 ease-in-out content-transform ${
      sidebarExpanded ? 'left-0 md:left-80' : 'left-0 md:left-16'
    }`}>
      <div className="flex items-center justify-between h-full px-3 md:px-6">
        {/* Empty space for layout */}
        <div className="flex items-center gap-3">
          {/* Supabase Connect Button */}
          {!isSupabaseConfigured() && onSupabaseConnect && (
            <button
              onClick={onSupabaseConnect}
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-xs md:text-sm font-medium"
              title="Connect to Supabase"
            >
              <Database size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">Connect to Supabase</span>
            </button>
          )}
        </div>

        {/* User Section */}
        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1 md:gap-3 px-1 md:px-3 py-1.5 md:py-2 hover:bg-gray-100/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-1 md:gap-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs md:text-sm font-medium">
                        {(user.name && user.name.length > 0) ? user.name.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  )}
                  <div className="hidden sm:block">
                    <div className="text-xs md:text-sm font-medium text-gray-700 truncate max-w-20 md:max-w-24">{user.name}</div>
                    <div className="text-xs text-gray-500 hidden md:block">Member</div>
                  </div>
                </div>
                <ChevronDown size={12} className="text-gray-400 hidden sm:block md:w-3.5 md:h-3.5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-44 md:w-56 bg-white rounded-lg shadow-lg border border-gray-200/50 py-2 z-50">
                  <div className="px-3 md:px-4 py-2 md:py-3 border-b border-gray-100">
                    <div className="text-xs md:text-sm font-medium text-gray-900 truncate">{user.name}</div>
                    <div className="text-xs text-gray-500 truncate">{user.email}</div>
                  </div>
                  
                  <div className="py-1">
                    <button className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <UserCircle size={14} className="md:w-4 md:h-4" />
                      Profile
                    </button>
                    <button className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings size={14} className="md:w-4 md:h-4" />
                      Settings
                    </button>
                  </div>
                  
                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={onLogout}
                      className="flex items-center gap-2 md:gap-3 w-full px-3 md:px-4 py-2 text-xs md:text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={14} className="md:w-4 md:h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium text-xs md:text-sm"
            >
              <User size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;