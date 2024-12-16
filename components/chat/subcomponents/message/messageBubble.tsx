'use client'

import React, { useState } from 'react';
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

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
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
      <div key={file.name} className="flex items-start space-x-2 mt-2 bg-blue-600/50 rounded-lg p-2">
        {isImage ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 mt-0.5 flex-shrink-0">
            <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 mt-0.5 flex-shrink-0">
            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
            <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs opacity-80">{fileSize}</p>
        </div>
      </div>
    );
  };

  const renderMessageContent = () => {
    if (message.role === 'user') {
      return (
        <div className="space-y-2">
          {/* Render text content */}
          {message.content.map((contentItem, idx) => {
            if (contentItem.type === 'text') {
              return <div key={idx}>{contentItem.text}</div>;
            } else if (contentItem.type === 'image_url') {
              return (
                 <Image
                  key={idx}
                  src={contentItem.image_url.url}
                  alt=""
                  width={500} // Or any reasonable default or calculated based on your layout.
                  height={300} // or any reasonable default or calculated based on your layout.
                  className="max-w-full rounded-md"
                 />
              );
            }
            return null;
          })}

          {/* Render files if present */}
          {message.files && message.files.map((file, idx) => (
            <div key={`file-${idx}`}>{renderFile(file)}</div>
          ))}

          {/* Show processing indicator if needed */}
          {message.processing && (
            <div className="text-sm opacity-75 mt-1">Processing files...</div>
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
            className="prose dark:prose-dark"
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              h1: ({ node, ...props }) => (
                <h1 className="text-3xl font-bold mt-6 mb-4 border-b pb-1" {...props} />
              ),
              h2: ({ node, ...props }) => (
                <h2 className="text-2xl font-bold mt-4 mb-3 border-b pb-1" {...props} />
              ),
              h3: ({ node, ...props }) => (
                <h3 className="text-xl font-semibold mt-3 mb-2" {...props} />
              ),
              p: ({ node, ...props }) => <p className="leading-relaxed" {...props} />,
              blockquote: ({ node, ...props }) => (
                <blockquote className="border-l-4 pl-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-md my-4 py-2" {...props} />
              ),
              ul: ({ node, ...props }) => <ul className="list-disc pl-2 mb-3 mt-1" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-2 mb-3 mt-1" {...props} />,
              li: ({ node, ...props }) => <li className="mb-3 mt-1" {...props} />,
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
                    className="max-w-full rounded-md my-2"
                    src={props.src}
                    alt={props.alt || ""} // Ensure alt is provided
                    width={500} // Or any reasonable default or calculated based on your layout.
                    height={300} // or any reasonable default or calculated based on your layout.
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
                      className="rounded-md max-w-xl 2xl:max-w-2xl text-sm"
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
                  <code
                    className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded-md"
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              table: ({ node, ...props }) => (
                <table className="w-full table-auto border-collapse my-4" {...props} />
              ),
              th: ({ node, ...props }) => (
                <th className="border border-gray-300 dark:border-gray-600 px-3 py-1 text-left bg-gray-200 dark:bg-gray-700" {...props} />
              ),
              td: ({ node, ...props }) => (
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-1" {...props} />
              ),
              hr: ({ node, ...props }) => <hr className="my-8 border-gray-300 dark:border-gray-600" {...props} />,
            }}
          >
            {contentItem.text}
          </ReactMarkdown>
        );
      } else if (contentItem.type === 'image_url') {
        return (
           <Image
             key={idx}
              className="max-w-full rounded-md my-2"
              src={contentItem.image_url.url}
              alt=""
              width={500} // Or any reasonable default or calculated based on your layout.
              height={300} // or any reasonable default or calculated based on your layout.
            />
         );
      }
      return null;
    });
  };

  return (
    <div
      className={`break-words transition-all duration-200 ease-in-out max-w-3xl 3xl:max-w-4xl ${
        message.role === 'user'
          ? 'bg-blue-500 text-white max-w-md text-base px-5 py-2.5 rounded-3xl'
          : 'text-black dark:text-white text-base w-full'
      }`}
    >
      {renderMessageContent()}
    </div>
  );
};

export default MessageBubble;