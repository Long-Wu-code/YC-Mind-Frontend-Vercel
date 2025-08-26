import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// 验证URL格式
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return !url.includes('your-supabase-url-here') && !url.includes('placeholder');
  } catch {
    return false;
  }
};

const isValidConfig = isValidUrl(supabaseUrl) && 
  supabaseAnonKey !== 'your-supabase-anon-key-here' && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseAnonKey.length > 10;

if (!isValidConfig) {
  console.warn('⚠️ Supabase configuration not set up. Please configure your Supabase project.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    flowType: 'pkce'
  }
});

// 验证Supabase配置
export const validateSupabaseConfig = (): boolean => {
  if (!isValidUrl(supabaseUrl)) {
    console.warn('⚠️ Supabase URL 未配置或无效');
    return false;
  }
  
  if (!isValidConfig) {
    console.warn('⚠️ Supabase Anon Key 未配置或无效');
    return false;
  }
  
  console.log('✅ Supabase 配置验证通过');
  return true;
};