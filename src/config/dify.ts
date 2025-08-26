import { DifyConfig } from '../services/difyApi';

// Dify配置 - 请根据你的实际配置修改这些值
export const difyConfig: DifyConfig = {
  // 你的Dify API密钥
  apiKey: import.meta.env.VITE_DIFY_API_KEY || 'app-your-api-key-here',
  
  // Dify API基础URL
  baseUrl: import.meta.env.VITE_DIFY_BASE_URL || 'https://api.dify.ai/v1',
  
  // 应用ID（可选，某些情况下需要）
  appId: import.meta.env.VITE_DIFY_APP_ID || undefined,
};

// 验证配置
export const validateDifyConfig = (): boolean => {
  if (!difyConfig.apiKey || difyConfig.apiKey === 'app-your-api-key-here') {
    console.error('❌ Dify API Key 未配置或无效');
    console.error('当前 API Key:', difyConfig.apiKey);
    console.error('请检查 .env 文件中的 VITE_DIFY_API_KEY 配置');
    return false;
  }
  
  if (!difyConfig.baseUrl) {
    console.error('❌ Dify Base URL 未配置');
    console.error('当前基础URL:', difyConfig.baseUrl);
    console.error('请检查 .env 文件中的 VITE_DIFY_BASE_URL 配置');
    return false;
  }
  
  console.log('✅ Dify 配置验证通过');
  console.log('- API Key 前缀:', difyConfig.apiKey.substring(0, 15) + '...');
  console.log('- Base URL:', difyConfig.baseUrl);
  console.log('- App ID:', difyConfig.appId || '未设置');
  
  // 检查API密钥格式
  if (!difyConfig.apiKey.startsWith('app-')) {
    console.warn('⚠️ 警告: API Key 格式可能不正确，应该以 "app-" 开头');
    return false;
  }
  
  return true;
};

// 获取配置信息用于调试
export const getConfigDebugInfo = () => {
  return {
    apiKeyPrefix: difyConfig.apiKey.substring(0, 15) + '...',
    baseUrl: difyConfig.baseUrl,
    appId: difyConfig.appId,
    isValidFormat: difyConfig.apiKey.startsWith('app-'),
    configSource: {
      apiKey: import.meta.env.VITE_DIFY_API_KEY ? '来自环境变量' : '使用默认值',
      baseUrl: import.meta.env.VITE_DIFY_BASE_URL ? '来自环境变量' : '使用默认值',
      appId: import.meta.env.VITE_DIFY_APP_ID ? '来自环境变量' : '未设置'
    }
  };
};