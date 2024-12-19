// MessageBubble.tsx
'use client'

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '@/types/chat';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const fileSize = formatFileSize(file.size);

    return (
      <div
        key={file.name}
        className="flex items-start space-x-2 mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      >
        {isImage ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5 mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400"
          >
            <path
              fillRule="evenodd"
              d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-5 mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400"
          >
            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {fileSize}
          </p>
        </div>
      </div>
    );
  };

  const renderMessageContent = useMemo(() => {
    if (message.role === 'user') {
      return (
        <div className="space-y-3">
          {/* User Message Text Content */}
          {message.content.map((contentItem, idx) => {
            if (contentItem.type === 'text') {
              return (
                <div
                  key={idx}
                  className="text-gray-800 dark:text-gray-200 text-base leading-relaxed"
                >
                  {contentItem.text}
                </div>
              );
            } else if (contentItem.type === 'image_url') {
              return (
                <Image
                  key={idx}
                  src={contentItem.image_url.url}
                  alt=""
                  width={500}
                  height={300}
                  className="max-w-full rounded-md"
                  loading="lazy"
                />
              );
            }
            return null;
          })}

          {/* User Message File Attachments */}
          {message.files && message.files.length > 0 && (
            <div className="mt-2">
              {message.files.map((file, idx) => (
                <div key={`file-${idx}`}>{renderFile(file)}</div>
              ))}
            </div>
          )}

          {/* User Message File Processing Indicator */}
          {message.processing && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Processing files...
            </div>
          )}
        </div>
      );
    }

    // Assistant message rendering
    return message.content.map((contentItem, idx) => {
      if (contentItem.type === 'text') {
        return (
          <ReactMarkdown
            key={idx}
            className="prose dark:prose-invert text-base leading-relaxed"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              h1: ({ node, ...props }) => (
                <h1
                  className="text-3xl font-bold mt-6 mb-4 border-b pb-2"
                  {...props}
                />
              ),
              h2: ({ node, ...props }) => (
                <h2
                  className="text-2xl font-bold mt-4 mb-3 border-b pb-2"
                  {...props}
                />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl font-semibold mt-3 mb-2" {...props} />
              ),
              p: ({ node, ...props }) => (
                <p className="my-3" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 pl-4 italic text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md my-4 py-2"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-6 my-2" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-6 my-2" {...props} />
              ),
              li: ({ node, ...props }) => (
                <li className="my-2" {...props} />
              ),
              a: ({ node, ...props }) => (
                <a
                  className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              img: ({ node, ...props }) => (
                <Image
                  className="max-w-full rounded-md my-4"
                  src={props.src}
                  alt={props.alt || ''}
                  width={500}
                  height={300}
                  loading="lazy"
                />
              ),
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const code = String(children).replace(/\n$/, '');
                return !inline && match ? (
                  <div className="relative group my-4">
                    <SyntaxHighlighter
                      style={materialDark}
                      language={match[1]}
                      PreTag="div"
                      showLineNumbers
                      wrapLines
                      className="rounded-md text-sm !p-4 overflow-x-auto"
                      {...props}
                    >
                      {code}
                    </SyntaxHighlighter>
                    <button
                      className="absolute top-2 right-2 bg-gray-200 dark:bg-gray-700 text-sm px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      onClick={() => copyToClipboard(code, message.id)}
                    >
                      {copied === message.id ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ) : (
                  <code
                    className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded-md text-sm"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              table: ({ node, ...props }) => (
                <table
                  className="w-full table-auto border-collapse my-4"
                  {...props}
                />
              ),
              th: ({ node, ...props }) => (
                <th
                  className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-left bg-gray-200 dark:bg-gray-700"
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td
                  className="border border-gray-300 dark:border-gray-600 px-3 py-2"
                  {...props}
                />
              ),
              hr: ({ node, ...props }) => (
                <hr className="my-6 border-gray-300 dark:border-gray-600" {...props} />
              ),
            }}
          >
            {contentItem.text}
          </ReactMarkdown>
        );
      } else if (contentItem.type === 'image_url') {
        return (
          <Image
            key={idx}
            className="max-w-full rounded-md my-4"
            src={contentItem.image_url.url}
            alt=""
            width={500}
            height={300}
            loading="lazy"
          />
        );
      }
      return null;
    });
  }, [message, copied]);

  return (
    <div
      className={`transition-all duration-200 ease-in-out ${
        message.role === 'user'
          ? 'bg-blue-500 text-white rounded-3xl max-w-sm px-5 py-4'
          : 'text-black dark:text-white '
      }`}
    >
      <div>
        {renderMessageContent}
      </div>
    </div>
  );
});

export default React.memo(MessageBubble);