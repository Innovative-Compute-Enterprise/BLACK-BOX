import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialOceanic } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
  };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000); // Clear "Copied" message after 2 seconds
    });
  };

  return (
    <div
      className={`break-words transition-all duration-200 ease-in-out ${
        message.role === 'user'
          ? 'bg-blue-500 text-white max-w-md text-base px-5 py-2.5 rounded-3xl'
          : 'text-black dark:text-white text-base w-full max-w-2xl 2xl:max-w-3xl'
      }`}
    >
      <ReactMarkdown
        className="prose dark:prose-dark max-w-none"
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <h1 className="text-3xl font-bold mt-6 mb-4 border-b pb-1" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold mt-4 mb-3 border-b pb-1" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold mt-3 mb-2" {...props} />
          ),
          // Paragraph
          p: ({ node, ...props }) => <p className="leading-relaxed" {...props} />,
          // Blockquote
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 pl-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-md my-4 py-2" {...props} />
          ),
          // Lists
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 mt-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 mt-1" {...props} />,
          li: ({ node, ...props }) => <li className="mb-3 mt-1" {...props} />,
          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          // Images
          img: ({ node, ...props }) => (
            <img className="max-w-full rounded-md my-2" alt={props.alt} {...props} />
          ),
          // Code Blocks and Inline Code
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');
            return !inline && match ? (
              <div className="relative group my-4">
                <SyntaxHighlighter
                  style={materialOceanic}
                  language={match[1]}
                  PreTag="div"
                  showLineNumbers
                  wrapLines
                  className="rounded-md"
                  {...props}
                >
                  {code}
                </SyntaxHighlighter>
                <button
                  className="absolute top-2 right-2 bg-gray-200 dark:bg-gray-700 text-sm px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  onClick={() => copyToClipboard(code, message.id)}
                >
                  {copied === message.id ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ) : (
              <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded-md text-sm" {...props}>
                {children}
              </code>
            );
          },
          // Tables
          table: ({ node, ...props }) => (
            <table className="w-full table-auto border-collapse my-4" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-gray-300 dark:border-gray-600 px-3 py-1 text-left bg-gray-200 dark:bg-gray-700" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-gray-300 dark:border-gray-600 px-3 py-1" {...props} />
          ),
          // Horizontal Rule
          hr: ({ node, ...props }) => <hr className="my-8 border-gray-300 dark:border-gray-600" {...props} />,
        }}
      >
        {message.content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageBubble;
