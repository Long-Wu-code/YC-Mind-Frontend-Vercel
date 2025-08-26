import { useState, useEffect } from 'react';
import { User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 获取初始会话
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('获取会话失败:', error);
          setError(error.message);
        } else if (session?.user) {
          setUser(mapSupabaseUserToUser(session.user));
        }
      } catch (err) {
        console.error('初始化认证失败:', err);
        setError('认证初始化失败');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('认证状态变化:', event, session?.user?.email);
        
        if (session?.user) {
          setUser(mapSupabaseUserToUser(session.user));
        } else {
          setUser(null);
        }
        
        setLoading(false);
        setError(null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 将Supabase用户映射为应用用户类型
  const mapSupabaseUserToUser = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.user_metadata?.name || 
            supabaseUser.email?.split('@')[0] || 
            'User',
      email: supabaseUser.email || '',
      avatar: supabaseUser.user_metadata?.avatar_url
    };
  };

  // 邮箱密码登录
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '登录失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 邮箱密码注册
  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '注册失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 登出
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Always clear local user state first
      setUser(null);
      
      // Check if there's an active user before attempting to sign out
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Only attempt server-side logout if there's an active user
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.warn('Supabase signOut warning:', error.message);
          // Only treat non-session errors as actual failures
          if (!error.message.includes('session_not_found') && !error.message.includes('Session from session_id claim')) {
            setError(error.message);
            return { success: false, error: error.message };
          }
        }
      }
      
      return { success: true };
    } catch (err) {
      // Always clear user state even if there's an exception
      setUser(null);
      const errorMessage = err instanceof Error ? err.message : '登出失败';
      console.warn('Logout exception:', errorMessage);
      // Return success since we cleared local state
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重置密码失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  return {
    user,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    resetPassword
  };
};