import { useState, useCallback, useMemo, useRef } from 'react';
import DifyApiService from '../services/difyApi';
import { difyConfig } from '../config/dify';

interface UseDifyOptions {
  onMessage?: (chunk: string) => void;
  onStreamStart?: () => void;
  onStreamEnd?: () => void;
  onError?: (error: Error) => void;
}

export const useDify = (options: UseDifyOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<string>('');

  // 使用 ref 来存储 AbortController，避免重新创建
  const abortControllerRef = useRef<AbortController | null>(null);

  // 流式显示控制
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef(false);
  const accumulatedContentRef = useRef<string>('');

  // 创建 Dify 服务实例
  const difyService = useMemo(() => {
    return new DifyApiService(difyConfig);
  }, []);

  // 中断请求
  const abortRequest = useCallback(() => {
    console.log('=== useDify abortRequest called ===');

    // 中断网络请求
    if (abortControllerRef.current) {
      console.log('Aborting current request...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 中断流式显示
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }

    isStreamingRef.current = false;
    setIsLoading(false);
    console.log('Request and streaming aborted successfully');
  }, []);


  // 发送消息
  const sendMessage = useCallback(async (
    message: string,
    conversationId?: string,
    streaming: boolean = false,
    files: Array<{id: string; name: string; size?: number}> = []
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      setCurrentResponse('');

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();

      // 设置会话ID
      if (conversationId) {
        difyService.setConversationId(conversationId);
      }

      if (streaming) {
        console.log('Starting streaming request...');
        options.onStreamStart?.();

        const stream = await difyService.sendMessage(
          message,
          'user',
          true,
          files,
          abortControllerRef.current.signal
        ) as ReadableStream;

        console.log('Got streaming response, processing...');
        let fullResponse = '';
        accumulatedContentRef.current = '';

        try {
          for await (const chunk of difyService.processStreamResponse(stream, abortControllerRef.current.signal)) {
            console.log('=== PROCESSING STREAM CHUNK ===');
            console.log('Event:', chunk.event);
            console.log('Data keys:', Object.keys(chunk.data || {}));
            console.log('Full chunk data:', JSON.stringify(chunk.data, null, 2));

            let chunkContent = '';

            // 处理不同类型的流式事件
            if (chunk.event === 'message' && chunk.data.answer) {
              chunkContent = chunk.data.answer;
              console.log('Found message content:', JSON.stringify(chunkContent));
            } else if (chunk.event === 'node_finished' && chunk.data?.data?.outputs?.answer) {
              chunkContent = chunk.data.data.outputs.answer;
              console.log('Found node_finished content:', JSON.stringify(chunkContent));
            } else if (chunk.event === 'workflow_finished' && chunk.data.outputs) {
              chunkContent = chunk.data.outputs.answer || chunk.data.outputs.text || chunk.data.outputs.result || '';
              console.log('Found workflow_finished content:', JSON.stringify(chunkContent));
            } else if (chunk.event === 'message_end' && chunk.data.metadata) {
              console.log('Received message_end event, skipping content extraction. Metadata:', chunk.data.metadata);
              continue;
            } else {
              // 尝试从其他可能的路径提取内容
              if (chunk.data?.answer) {
                chunkContent = chunk.data.answer;
                console.log('Found content in data.answer:', JSON.stringify(chunkContent));
              } else if (chunk.data?.text) {
                chunkContent = chunk.data.text;
                console.log('Found content in data.text:', JSON.stringify(chunkContent));
              } else if (chunk.data?.content) {
                chunkContent = chunk.data.content;
                console.log('Found content in data.content:', JSON.stringify(chunkContent));
              }
            }

            // 处理增量内容 - 修复版本
            if (chunkContent && typeof chunkContent === 'string') {
              console.log('=== PROCESSING CHUNK CONTENT ===');
              console.log('Chunk content:', JSON.stringify(chunkContent));
              console.log('Chunk content length:', chunkContent.length);

              // 更健壮的增量内容检测
              let newContent = '';
              let isIncremental = false;

              // 检查是否为增量内容
              if (accumulatedContentRef.current && chunkContent.startsWith(accumulatedContentRef.current)) {
                // 标准增量情况：新内容包含之前所有内容
                newContent = chunkContent.slice(accumulatedContentRef.current.length);
                isIncremental = true;
              } else if (!accumulatedContentRef.current) {
                // 首次接收内容
                newContent = chunkContent;
                isIncremental = true;
              } else if (chunkContent.length < accumulatedContentRef.current.length) {
                // 可能是重置后的新内容
                newContent = chunkContent;
                isIncremental = true;
                accumulatedContentRef.current = ''; // 重置累积内容
              }

              if (isIncremental && newContent) {
                // 处理增量内容
                console.log('Found incremental content:', JSON.stringify(newContent));
                accumulatedContentRef.current += newContent;
                fullResponse = accumulatedContentRef.current;

                // 发送增量内容
                if (options.onMessage) {
                  options.onMessage(newContent);
                }
              } else {
                // 处理完整内容替换情况
                console.log('Handling complete content replacement');
                accumulatedContentRef.current = chunkContent;
                fullResponse = chunkContent;

                // 发送完整内容（先清空再发送）
                if (options.onMessage) {
                  options.onMessage(''); // 清空
                  // 使用微任务确保清空操作先执行
                  Promise.resolve().then(() => {
                    if (options.onMessage) {
                      options.onMessage(chunkContent);
                    }
                  });
                }
              }

              setCurrentResponse(fullResponse);
            }
          }

          // 流式处理完成
          console.log('=== STREAM PROCESSING COMPLETED ===');
          console.log('Final accumulated content:', JSON.stringify(accumulatedContentRef.current));
          console.log('Final response length:', fullResponse.length);
          options.onStreamEnd?.();

          return {
            answer: fullResponse,
            conversation_id: difyService.getConversationId() || conversationId
          };
        } catch (streamError) {
          if (streamError instanceof Error && streamError.name === 'AbortError') {
            console.log('Stream processing aborted');
            setIsLoading(false);
            abortControllerRef.current = null;
            return;
          }
          throw streamError;
        }
      } else {
        const response = await difyService.sendMessage(
          message,
          'user',
          false,
          files,
          abortControllerRef.current.signal
        );

        return response;
      }
    } catch (error) {
      console.error('useDify sendMessage error:', error);

      // 检查是否为中断错误
      if (error instanceof Error &&
          (error.name === 'AbortError' ||
           error.message.includes('signal is aborted') ||
           error.message.includes('aborted'))) {
        setIsLoading(false);
        abortControllerRef.current = null;
        return;
      }

      const errorMessage = error instanceof Error ? error.message : '未知错误';
      accumulatedContentRef.current = '';
      setError(errorMessage);
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      return;
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  }, [difyService, options]);

  // 上传文件
  const uploadFile = useCallback(async (file: File): Promise<{ id: string; name: string; size?: number }> => {
    console.log('=== useDify uploadFile START ===');
    console.log('File:', file.name, file.size);

    try {
      setIsLoading(true);
      setError(null);

      const result = await difyService.uploadFile(file);
      console.log('File upload success:', result);
      return result;
    } catch (error) {
      console.error('=== useDify uploadFile ERROR ===');
      console.error('Error details:', error);

      const errorMessage = error instanceof Error ? error.message : '文件上传失败';
      setError(errorMessage);
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [difyService, options]);

  // 获取当前响应
  const getCurrentResponse = useCallback(() => {
    return currentResponse;
  }, [currentResponse]);

  return {
    sendMessage,
    uploadFile,
    abortRequest,
    getCurrentResponse,
    isLoading,
    error
  };
};