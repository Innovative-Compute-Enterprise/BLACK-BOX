"use client";

import React, { useState, useMemo, useCallback, ErrorInfo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import Image from 'next/image';
import { Message, FileAttachment } from "@/src/types/chat";
import { tryParseStructuredContent } from "@/src/lib/utils";
import StructuredContent from "./StructuredContent";

interface MessageBubbleProps {
  message: Message;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode, fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode, fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MessageBubble error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

const MessageBubble: React.FC<MessageBubbleProps> = React.memo(
  ({ message }) => {
    const [copied, setCopied] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    const openImageModal = useCallback((url: string) => {
      console.log('[MessageBubble] Opening image modal with URL:', url);
      setSelectedImage(url);
    }, []);

    const closeImageModal = useCallback(() => {
      setSelectedImage(null);
    }, []);

    // Debug log for message content
    useEffect(() => {
      console.log(`[MessageBubble] Rendering message ${message.id}`, {
        role: message.role,
        content: message.content,
        files: message.files,
        hasFiles: !!message.files && message.files.length > 0
      });
    }, [message]);

    const copyToClipboard = useCallback((code: string, id: string) => {
      try {
        navigator.clipboard.writeText(code).then(() => {
          setCopied(id);
          setTimeout(() => setCopied(null), 2000);
        }).catch(err => {
          console.error("Failed to copy text:", err);
        });
      } catch (error) {
        console.error("Error copying to clipboard:", error);
      }
    }, []);

    const formatFileSize = useCallback((bytes: number): string => {
      if (bytes === 0) return "0 Bytes";
      const k = 1024;
      const sizes = ["Bytes", "KB", "MB", "GB"];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }, []);

    const renderFile = useCallback(
      (file: FileAttachment) => {
        const isImage = file.mime_type.startsWith("image/");
        const fileSize = formatFileSize(file.size);

        if (isImage && file.url) {
          return (
            <div
              key={file.name}
              className="cursor-pointer overflow-hidden rounded-lg shadow-md mt-2"
              onClick={() => openImageModal(file.url)}
            >
              <img 
                src={file.url}
                alt={file.name}
                className="max-w-full w-full h-auto rounded-lg hover:opacity-90 transition-opacity"
                onError={(e) => {
                  console.error("Failed to load attached image");
                  const target = e.target as HTMLImageElement;
                  if (target.parentElement) {
                    const loadingMessage = document.createElement('div');
                    loadingMessage.className = 'p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg';
                    loadingMessage.textContent = 'Image loading failed';
                    target.parentElement.replaceChild(loadingMessage, target);
                  }
                }}
              />
            </div>
          );
        }

        return (
          <div
            key={file.name}
            className="flex items-start space-x-2 mt-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm"
            role="figure"
            aria-label={`Attached file: ${file.name}, size: ${fileSize}`}
          >
            {isImage ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-5 mt-0.5 flex-shrink-0 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
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
                aria-hidden="true"
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
            {file.url && (
              <>
                {isImage ? (
                  <button 
                    onClick={() => openImageModal(file.url)}
                    className="flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
                    aria-label={`View ${file.name}`}
                  >
                    View
                  </button>
                ) : (
                  <a 
                    href={file.url} 
                    download={file.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-3 py-1 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
                    aria-label={`Download ${file.name}`}
                  >
                    Download
                  </a>
                )}
              </>
            )}
          </div>
        );
      },
      [formatFileSize, openImageModal]
    );

    const markdownStyleComponents = useMemo(
      () => ({
        h1: (props: any) => (
          <h1
            className="text-4xl font-bold mt-8 mb-5 pb-2 border-b-2 border-gray-300 dark:border-gray-600"
            {...props}
          />
        ),
        h2: ({ ...props }: any) => (
          <h2
            className="text-2xl font-bold mt-5 mb-3 border-b border-gray-200 dark:border-gray-700 pb-1"
            {...props}
          />
        ),
        h3: ({ ...props }: any) => (
          <h3
            className="text-xl font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200"
            {...props}
          />
        ),
        h4: ({ ...props }: any) => (
          <h4 className="text-lg font-semibold mt-5 mb-4 text-gray-700 dark:text-gray-300" {...props} />
        ),
        p: ({ ...props }: any) => (
          <p className="text-base leading-loose tracking-wide text-black dark:text-white" {...props} />
        ),
        ul: ({ ...props }: any) => (
          <ul className="list-disc list-inside space-y-2 my-4 pl-4 text-gray-800 dark:text-gray-200" role="list" {...props} />
        ),
        ol: ({ ...props }: any) => (
          <ol className="list-decimal list-inside space-y-3 mb-9 mt-3 pl-4 text-gray-800 dark:text-gray-200" role="list" {...props} />
        ),
        li: ({ ...props }: any) => (
          <li className="pl-2 leading-relaxed tracking-wide" {...props} />
        ),
        blockquote: ({ ...props }: any) => (
          <blockquote className="border-l-4 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 italic py-2 px-4 rounded-r-md my-4" {...props} />
        ),
        table: ({ ...props }: any) => (
          <div className="overflow-x-auto my-4">
            <table className="table-auto w-full text-left border-collapse rounded-sm overflow-hidden shadow-sm" {...props} />
          </div>
        ),
        th: ({ ...props }: any) => (
          <th className="border bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200" {...props} />
        ),
        td: ({ ...props }: any) => (
          <td className="border px-3 py-2 rounded-md text-gray-800 dark:text-gray-200" {...props} />
        ),
        a: ({ ...props }: any) => (
          <a
            className="text-blue-600 dark:text-blue-400 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
          />
        ),
        hr: ({ ...props }: any) => (
          <hr className="border-gray-200 dark:border-gray-600 my-6" {...props} />
        ),
        img: ({ src, alt, ...props }: any) => (
          <Image
            className="max-w-full h-auto rounded-lg shadow-sm my-4"
            src={src}
            alt={alt || "Markdown Image"}
            width={600}
            height={400}
            loading="lazy"
            onError={() => console.error(`Failed to load image: ${src}`)}
            {...props}
          />
        ),
        code: ({ inline, className, children, ...props }: any) => {
          const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;
          return inline ? (
            <code
              className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded-md text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          ) : (
            <div className="relative block not-prose">
              <pre className="block bg-gray-900 dark:bg-black overflow-x-auto rounded-md p-4 my-4">
                <code
                  id={codeId}
                  className="font-mono text-sm text-gray-100"
                  {...props}
                >
                  {children}
                </code>
              </pre>
              <button
                onClick={() => {
                  const codeElement = document.getElementById(codeId);
                  if (codeElement) {
                    copyToClipboard(codeElement.textContent || "", codeId);
                  }
                }}
                className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-gray-200 p-1 rounded text-xs"
                aria-label="Copy code to clipboard"
              >
                {copied === codeId ? "Copied!" : "Copy"}
              </button>
            </div>
          );
        }
      }),
      [copied, copyToClipboard]
    );
    

    const renderFileAttachments = useCallback(() => {
      // Skip for user messages - we handle all files in messageContent
      if (message.role === "user") {
        return null;
      }
      
      // Debug log for files
      console.log(`[MessageBubble] Checking for files in assistant message ${message.id}:`, {
        hasMessageFiles: !!message.files && message.files.length > 0,
        fileCount: message.files?.length || 0,
        hasFileContentItems: message.content.some(item => 
          item.type === 'file_url' || item.type === 'image_url')
      });
      
      // For assistant messages, handle file attachments
      const explicitFiles = message.files || [];
      const fileContentItems = message.content
        .filter(item => item.type === 'file_url')
        .map(item => {
          const fileItem = item as { 
            type: 'file_url', 
            file_url: { url: string }, 
            mime_type?: string, 
            file_name?: string 
          };
          
          return {
            id: `file-${Math.random().toString(36).substring(2, 9)}`,
            name: fileItem.file_name || 'File',
            type: 'document',
            size: 0,
            url: fileItem.file_url.url,
            mime_type: fileItem.mime_type || 'application/octet-stream',
            isImage: false
          };
        });
      
      const allFiles = [...explicitFiles];
      
      fileContentItems.forEach(file => {
        const fileExists = allFiles.some(f => f.url === file.url);
        if (!fileExists) {
          allFiles.push(file);
        }
      });
      
      if (allFiles.length === 0) {
        return null;
      }
      
      console.log(`[MessageBubble] Rendering ${allFiles.length} file attachments for assistant message ${message.id}`);
      
      return (
        <div className="mt-3 space-y-2">
          {allFiles.map((file, idx) => (
            <React.Fragment key={`${file.id}-${idx}`}>
              {renderFile(file)}
            </React.Fragment>
          ))}
        </div>
      );
    }, [message.files, message.content, message.id, message.role, renderFile]);

    // Helper function to get the right content to display
    const getContent = useCallback(() => {
      try {
        console.log(`[MessageBubble] Getting content for message:`, message.id, message.content);
        
        if (message.pending) {
          return (
            <div className="typing-indicator text-sm text-gray-500 dark:text-gray-400" aria-label="AI is typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          );
        }
        
        // Extract text content from message
        const textContent = message.content
          .filter(item => item.type === 'text')
          .map(item => (item as { type: 'text', text: string }).text)
          .join('\n');
        
        // Try to parse structured content from text content
        const structuredContent = textContent ? tryParseStructuredContent(textContent) : null;
        if (structuredContent) {
          console.log('[MessageBubble] Rendering as structured content');
          return <StructuredContent content={structuredContent} />;
        }
        
        // If it's not structured content but has text, render as markdown
        if (textContent) {
          console.log('[MessageBubble] Rendering as markdown');
          return (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={markdownStyleComponents}
            >
              {textContent}
            </ReactMarkdown>
          );
        }
        
        // If no text content but has file attachments
        if (message.files && message.files.length > 0 && !textContent) {
          console.log('[MessageBubble] Message contains only files');
          return <div className="text-sm text-gray-500 dark:text-gray-400">File attachment</div>;
        }
        
        // Fallback for empty or unknown content
        return <div className="text-sm text-gray-500 dark:text-gray-400">Empty message</div>;
      } catch (error) {
        console.error('[MessageBubble] Error rendering message content:', error);
        return <div className="text-red-500">Error rendering message</div>;
      }
    }, [message, markdownStyleComponents]);

    const messageContent = useMemo(() => {
      try {
        if (message.role === "user") {
          // Process and organize content items
          const textItems = message.content.filter(item => item.type === "text");
          const imageItems = message.content.filter(item => item.type === "image_url");
          const fileItems = message.content.filter(item => item.type === "file_url");
          
          // Track which file URLs we've already displayed
          const displayedFileUrls = new Set();
          
          // Log to debug the content breakdown
          console.log(`[MessageBubble] User message content breakdown:`, {
            textItems: textItems.length,
            imageItems: imageItems.length,
            fileItems: fileItems.length,
            files: message.files?.length || 0
          });
          
          return (
            <div className="space-y-3">
              {/* Text content in the bubble */}
              {textItems.length > 0 && (
                <div className="bg-blue-500 dark:bg-blue-700 p-2 text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm max-w-lg w-fit ml-auto">
                  {textItems.map((contentItem, idx) => (
                    <div
                      key={`text-${idx}`}
                      className="text-white text-base leading-loose tracking-wider"
                    >
                      {contentItem.text}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Image content outside of the bubble */}
              {imageItems.length > 0 && (
                <div className="space-y-4 my-2 ml-auto w-full flex flex-col items-end">
                  {imageItems.map((contentItem, idx) => {
                    // Track this image URL as displayed
                    displayedFileUrls.add(contentItem.image_url.url);
                    
                    return (
                      <div 
                        key={`image-${idx}`} 
                        className="cursor-pointer overflow-hidden rounded-lg shadow-md max-w-[80%]"
                        onClick={() => openImageModal(contentItem.image_url.url)}
                      >
                        <img
                          src={contentItem.image_url.url}
                          alt="User uploaded image"
                          className="w-full h-auto rounded-lg hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            console.error("Failed to load user image with regular img tag");
                            // Try with Image component as backup
                            const target = e.target as HTMLImageElement;
                            if (target.parentElement) {
                              const imageWrapper = document.createElement('div');
                              const errorBoundary = document.createElement('div');
                              errorBoundary.className = 'relative';
                              
                              // Create a loading message
                              const loadingMessage = document.createElement('div');
                              loadingMessage.className = 'absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 opacity-80';
                              loadingMessage.textContent = 'Loading image...';
                              
                              errorBoundary.appendChild(loadingMessage);
                              imageWrapper.appendChild(errorBoundary);
                              target.parentElement.replaceChild(imageWrapper, target);
                            }
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* File content */}
              {fileItems.length > 0 && (
                <div className="space-y-2 my-2 ml-auto w-full flex flex-col items-end">
                  {fileItems.map((contentItem, idx) => {
                    const fileItem = contentItem as { 
                      type: 'file_url', 
                      file_url: { url: string }, 
                      mime_type?: string, 
                      file_name?: string 
                    };
                    
                    // Track this file URL as displayed
                    displayedFileUrls.add(fileItem.file_url.url);
                    
                    const fileAttachment = {
                      id: `file-content-${idx}`,
                      name: fileItem.file_name || 'File',
                      url: fileItem.file_url.url,
                      mime_type: fileItem.mime_type || 'application/octet-stream',
                      size: 0,
                      type: 'document',
                      isImage: false
                    };
                    
                    return (
                      <div key={`file-content-${idx}`} className="max-w-lg">
                        {renderFile(fileAttachment)}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Only show message.files that haven't already been displayed inline */}
              {message.files && message.files.length > 0 && (
                <div className="mt-2 ml-auto w-full flex flex-col items-end">
                  {message.files
                    .filter(file => !displayedFileUrls.has(file.url))
                    .map((file, idx) => (
                      <div key={`explicit-file-${idx}`} className="max-w-lg">
                        {renderFile(file)}
                      </div>
                    ))}
                </div>
              )}
              
              {message.processing && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 bg-white dark:bg-gray-800 p-2 rounded-md">
                  Processing files...
                </div>
              )}
            </div>
          );
        }

        return (
          <>
            {/* Text content first */}
            {message.content.filter(item => item.type === "text").map((contentItem, idx) => {
              const structuredContent = tryParseStructuredContent(contentItem.text);
              if (structuredContent) {
                return (
                  <ErrorBoundary 
                    key={idx}
                    fallback={
                      <div className="text-red-500 p-3 border border-red-300 rounded-md">
                        Failed to render structured content
                      </div>
                    }
                  >
                    <StructuredContent key={idx} content={structuredContent} />
                  </ErrorBoundary>
                );
              }

              // If not structured content, render as markdown
              return (
                <ErrorBoundary
                  key={idx}
                  fallback={
                    <div className="text-red-500 p-3 border border-red-300 rounded-md">
                      Failed to render markdown content
                    </div>
                  }
                >
                  <ReactMarkdown
                    key={idx}
                    className="markdown-body dark:markdown-body-dark text-base leading-loose"
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={markdownStyleComponents}
                  >
                    {contentItem.text}
                  </ReactMarkdown>
                </ErrorBoundary>
              );
            })}
            
            {/* Images separately */}
            {message.content.filter(item => item.type === "image_url").map((contentItem, idx) => (
              <div 
                key={`ai-image-${idx}`}
                className="my-3 cursor-pointer overflow-hidden rounded-lg shadow-md max-w-2xl" 
                onClick={() => openImageModal((contentItem as any).image_url.url)}
              >
                <img
                  src={(contentItem as any).image_url.url}
                  alt="AI generated image"
                  className="max-w-full w-full h-auto rounded-lg hover:opacity-90 transition-opacity"
                  onError={(e) => {
                    console.error("Failed to load AI image");
                    const target = e.target as HTMLImageElement;
                    if (target.parentElement) {
                      const loadingMessage = document.createElement('div');
                      loadingMessage.className = 'p-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg';
                      loadingMessage.textContent = 'Image loading failed';
                      target.parentElement.replaceChild(loadingMessage, target);
                    }
                  }}
                />
              </div>
            ))}
          </>
        );
      } catch (error) {
        console.error("Error rendering message content:", error);
        return (
          <div className="text-red-500 p-3 border border-red-300 rounded-md">
            An error occurred while rendering this message
          </div>
        );
      }
    }, [message, renderFile, markdownStyleComponents, openImageModal]);

    const isPending = message.pending;

    // Always show image modal if selectedImage is set
    const imageModal = selectedImage ? (
      <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        onClick={closeImageModal}
      >
        <div className="relative max-w-4xl max-h-[90vh]">
          <ErrorBoundary
            fallback={
              <div className="bg-gray-800 p-8 text-white text-center">
                <p>Failed to load image</p>
                <button
                  onClick={closeImageModal}
                  className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Close
                </button>
              </div>
            }
          >
            <img 
              src={selectedImage} 
              alt="Full size image" 
              className="max-w-full max-h-[85vh] object-contain"
              onError={() => console.error("Modal image failed to load:", selectedImage)}
            />
          </ErrorBoundary>
          <button
            onClick={closeImageModal}
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
            aria-label="Close image preview"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    ) : null;

    return (
      <>
        {imageModal}
        <ErrorBoundary
          fallback={
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
              Something went wrong rendering this message
            </div>
          }
        >
          <div className={`relative w-full ${message.role === "user" ? "flex justify-end" : ""}`}>
            <div 
              className={`prose dark:prose-invert w-full ${
                message.role === "assistant" ? "dark:text-white text-black" : ""
              }`}
            >
              <div className={`w-full ${message.role === "user" ? "" : ""}`}>
                {/* For user messages, all content including files is handled in messageContent */}
                {message.role === "user" ? (
                  messageContent
                ) : (
                  <>
                    {/* For assistant messages, render content and files separately */}
                    <div>
                      {messageContent}
                    </div>
                    {renderFileAttachments()}
                  </>
                )}
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </>
    );
  }
);

MessageBubble.displayName = "MessageBubble";

export default React.memo(MessageBubble);
