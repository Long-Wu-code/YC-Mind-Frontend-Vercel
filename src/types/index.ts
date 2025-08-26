export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'file' | 'linkedin';
  fileName?: string;
  linkedinUrl?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  conversationId?: string; // Dify会话ID
}

export interface DifyStreamChunk {
  event: string;
  data: any;
}