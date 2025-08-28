import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // 换行处理
          br: () => <br className="leading-normal" />,
          // 自定义标题样式
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 text-gray-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 text-gray-700">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold mb-2 text-gray-700">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-semibold mb-2 text-gray-600">
              {children}
            </h6>
          ),
          // 段落样式
          p: ({ children }) => (
            <p className="mb-3 text-gray-700 leading-relaxed">
              {children}
            </p>
          ),
          // 列表样式
          ul: ({ children }) => (
            <ul className="mb-3 ml-4 space-y-1 list-disc text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 ml-4 space-y-1 list-decimal text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          // 代码块样式
          code: ({ inline, children, ...props }) => {
            if (inline) {
              return (
                <code 
                  className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code 
                className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-sm font-mono mb-3"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto">
              {children}
            </pre>
          ),
          // 引用样式
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 mb-3 text-gray-600 italic">
              {children}
            </blockquote>
          ),
          // 链接样式
          a: ({ children, href }) => (
            <a 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
          // 表格样式
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left font-semibold text-gray-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 py-2 text-gray-700">
              {children}
            </td>
          ),
          // 分隔线样式
          hr: () => (
            <hr className="my-6 border-t border-gray-300" />
          ),
          // 强调样式
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;