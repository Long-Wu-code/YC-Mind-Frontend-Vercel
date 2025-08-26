export interface DifyConfig {
  apiKey: string;
  baseUrl: string;
  appId?: string;
}

export interface DifyMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DifyResponse {
  answer: string;
  conversation_id?: string;
  message_id?: string;
}

export interface DifyStreamResponse {
  event: string;
  data: any;
}

class DifyApiService {
  private config: DifyConfig;
  private conversationId: string | null = null;

  constructor(config: DifyConfig) {
    this.config = config;
  }

  // 设置会话ID
  setConversationId(conversationId: string | null) {
    this.conversationId = conversationId;
  }

  // 获取会话ID
  getConversationId(): string | null {
    return this.conversationId;
  }

  // 发送消息到Dify
  async sendMessage(
    message: string,
    user: string = 'user',
    streaming: boolean = false,
    files: Array<{id: string; name: string; size?: number}> = [],
    signal?: AbortSignal
  ): Promise<DifyResponse | ReadableStream> {
    console.log('=== 发送消息到 Dify ===');
    console.log('消息内容:', message);
    console.log('用户标识:', user);
    console.log('流式模式:', streaming);
    console.log('文件数量:', files.length);
    console.log('API Key 前缀:', this.config.apiKey.substring(0, 15) + '...');
    console.log('请求 URL:', `${this.config.baseUrl}/v1/chat-messages`);
    
    // 验证配置
    if (!this.config.apiKey || this.config.apiKey === 'app-your-api-key-here') {
      throw new Error('❌ Dify API Key 未配置，请检查 .env 文件中的 VITE_DIFY_API_KEY');
    }
    
    if (!this.config.baseUrl) {
      throw new Error('❌ Dify Base URL 未配置，请检查 .env 文件中的 VITE_DIFY_BASE_URL');
    }
    
    const url = `${this.config.baseUrl}/chat-messages`;
    
    // 处理文件格式
    const processedFiles = files.map(file => {
      console.log('=== 处理文件 ===');
      console.log('文件ID:', file.id);
      console.log('文件名:', file.name);
      console.log('文件大小:', file.size);
      
      // 验证文件ID是否有效
      if (!file.id || file.id === 'undefined' || file.id === 'null') {
        console.error('文件ID无效:', file.id);
        throw new Error(`文件ID无效: ${file.id}`);
      }
      
      return {
        type: 'document',
        transfer_method: 'local_file',
        upload_file_id: file.id,
        name: file.name
      };
    });
    
    console.log('=== 处理后的文件列表 ===');
    console.log('文件数量:', processedFiles.length);
    console.log('文件详情:', JSON.stringify(processedFiles, null, 2));
    
    const body = {
      inputs: {},
      query: message,
      response_mode: streaming ? 'streaming' : 'blocking',
      conversation_id: this.conversationId,
      user: user,
      files: processedFiles
    };

    // 如果查询中包含文件相关的文本但没有文件，则记录警告
    if ((message.includes('attached my resume') || message.includes('resume for analysis')) && processedFiles.length === 0) {
      console.warn('警告: 查询提到简历但没有上传文件');
    }

    // 添加更详细的日志记录
    console.log('=== DIFY API REQUEST ===');
    console.log('URL:', url);
    console.log('Message:', message);
    console.log('Files count:', processedFiles.length);
    console.log('Files details:', JSON.stringify(processedFiles, null, 2));
    console.log('Request body:', JSON.stringify(body, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: signal,
      });

      console.log('响应状态:', response.status);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('=== API 错误响应 ===');
        console.error('状态码:', response.status);
        console.error('错误内容:', errorText);
        
        // 特殊处理403错误
        if (response.status === 403) {
          throw new Error(`API Key 验证失败 (403): 请检查 .env 文件中的 VITE_DIFY_API_KEY 是否正确。错误详情: ${errorText}`);
        }
        
        throw new Error(`Dify API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      if (streaming) {
        console.log('返回流式响应进行处理');
        return response.body!;
      } else {
        const data = await response.json();
        console.log('非流式响应数据:', data);
        // 保存会话ID以便后续使用
        if (data.conversation_id) {
          this.conversationId = data.conversation_id;
          console.log('保存会话ID:', data.conversation_id);
        }
        return data;
      }
    } catch (error) {
      console.error('=== 发送消息错误 ===');
      console.error('错误详情:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('请求被用户中断');
        throw error;
      }
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到 Dify API，请检查网络连接、代理设置和 CORS 配置');
      }
      throw error;
    }
  }

  // 流式响应处理 - 重写版本
  async *processStreamResponse(stream: ReadableStream, signal?: AbortSignal): AsyncGenerator<DifyStreamResponse> {
    console.log('=== processStreamResponse START ===');
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;

    try {
      while (true) {
        chunkCount++;
        console.log(`=== Reading chunk ${chunkCount} ===`);
        
        // 检查是否被中断
        if (signal?.aborted) {
          console.log('Stream processing aborted by signal');
          break;
        }
        
        const { done, value } = await reader.read();
        console.log(`Chunk ${chunkCount} - done:`, done, 'value length:', value?.length || 0);
        
        if (signal?.aborted) {
          console.log('Stream processing aborted after read');
          break;
        }
        
        if (done) {
          console.log(`Stream reading completed after ${chunkCount} chunks`);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        console.log(`Chunk ${chunkCount} decoded:`, JSON.stringify(chunk));
        buffer += chunk;
        console.log(`Buffer after chunk ${chunkCount}:`, JSON.stringify(buffer));
        
        // 按行分割数据
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一行（可能不完整）
        console.log(`Processing ${lines.length} lines from chunk ${chunkCount}`);

        for (const line of lines) {
          const trimmedLine = line.trim();
          console.log(`Processing line:`, JSON.stringify(trimmedLine));
          
          // 处理 SSE 格式的数据
          if (trimmedLine.startsWith('data: ')) {
            const dataStr = trimmedLine.slice(6);
            console.log(`Found data line:`, JSON.stringify(dataStr));
            
            // 跳过结束标记
            if (dataStr === '[DONE]') {
              console.log(`Stream DONE marker received after ${chunkCount} chunks`);
              return;
            }
            
            try {
              const data = JSON.parse(dataStr);
              console.log(`=== PARSED DATA FROM CHUNK ${chunkCount} ===`);
              console.log('Event:', data.event);
              console.log('Full data:', JSON.stringify(data, null, 2));
              
              // 添加更详细的数据结构日志
              if (data.event === 'node_finished' && data.data?.data?.outputs) {
                console.log('Node finished outputs:', data.data.data.outputs);
              }
              if (data.event === 'workflow_finished' && data.data?.outputs) {
                console.log('Workflow finished outputs:', data.data.outputs);
              }
              if (data.event === 'message' && data.answer) {
                console.log('Message answer:', JSON.stringify(data.answer));
                console.log('Message answer length:', data.answer.length);
              }
              
              // 确保数据结构正确
              if (data && typeof data === 'object') {
                // 保存会话ID
                if (data.conversation_id) {
                  this.conversationId = data.conversation_id;
                }
                
                // 返回标准化的流式响应
                console.log(`Yielding event: ${data.event}`);
                yield {
                  event: data.event || 'message',
                  data: data
                };
              }
            } catch (parseError) {
              console.warn(`Failed to parse stream data from chunk ${chunkCount}:`, JSON.stringify(dataStr), 'Error:', parseError);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Stream processing aborted');
      } else {
        console.error(`Stream processing error after ${chunkCount} chunks:`, error);
        throw error;
      }
    } finally {
      console.log(`=== processStreamResponse END after ${chunkCount} chunks ===`);
      reader.releaseLock();
    }
  }

  // 上传文件到Dify
  async uploadFile(file: File): Promise<{ id: string; name: string; size?: number }> {
    console.log('=== DifyApiService uploadFile START ===');
    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    
    const url = `${this.config.baseUrl}/files/upload`;
    console.log('Upload URL:', url);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', 'user');
    // 添加文件类型信息，确保Dify能正确处理文档文件
    formData.append('purpose', 'retrieval');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        throw new Error(`File upload error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('=== DIFY UPLOAD RESPONSE ===');
      console.log('Upload success result:', result);
      
      // 根据Dify API文档，文件上传成功后返回的数据结构可能不同
      // 尝试从不同位置获取文件ID
      const fileId = result.id || result.file_id || result.upload_file_id;
      const fileName = result.name || result.filename || result.original_filename;
      const fileSize = result.size || result.file_size;
      
      console.log('File ID:', fileId);
      console.log('File name:', fileName);
      console.log('File size:', fileSize);
      
      // 返回标准化的结果
      return {
        id: fileId,
        name: fileName,
        size: fileSize
      };
    } catch (error) {
      console.error('=== DifyApiService uploadFile ERROR ===');
      console.error('Error details:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('无法上传文件到Dify API，请检查网络连接和CORS设置');
      }
      throw error;
    }
  }

  // 获取会话历史
  async getConversationHistory(conversationId: string) {
    const url = `${this.config.baseUrl}/messages?conversation_id=${conversationId}&limit=100`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get conversation error response:', errorText);
        throw new Error(`Get conversation error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Get conversation success result:', result);
      return result;
    } catch (error) {
      console.error('=== DifyApiService getConversationHistory ERROR ===');
      console.error('Error details:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('无法获取会话历史，请检查网络连接和CORS设置');
      }
      throw error;
    }
  }
}

export default DifyApiService;