// 欢迎消息配置
export const getWelcomeMessage = (): string => {
  return import.meta.env.VITE_WELCOME_MESSAGE || `Hey there! Looking for your next YC startup role?
Drop your role, preferred location, salary range, visa needs, and full-time or contract. More detail = smarter matches.

Example:
Senior/AI PM • Bellevue or remote • $180–220k • Needs H-1B sponsorship • Full-time

Full Stack engineer • San Francisco • at least $150 • Full-time

Find the best fitting PM jobs for me from YC startup targeting to B2B AI infra market, within 10 persons. I can work remotely or onsite in Bellevue. Please also consider the founders previous exp, the industry trend, org culture and candidates persona. I don't need visa sponsorship.`;
};

// 格式化欢迎消息，处理换行符
export const formatWelcomeMessage = (message: string): string => {
  return message.replace(/\\n/g, '\n');
};