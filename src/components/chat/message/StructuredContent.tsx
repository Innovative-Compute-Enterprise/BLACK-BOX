'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import Image from 'next/image';

// Define more specific types for structured content
interface StructuredContentItem {
  type: string;
  content?: string;
  level?: number;
  items?: string[];
  style?: 'numbered' | 'bullet';
  url?: string;
  alt?: string;
  caption?: string;
  sources?: Array<{title: string, url: string}>;
}

interface StructuredContentProps {
  content: StructuredContentItem[];
}

// Reusable Markdown component with consistent styling and error handling
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  try {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: (props) => (
            <a 
              {...props} 
              className="text-blue-600 dark:text-blue-400 hover:underline"
              target="_blank" 
              rel="noopener noreferrer"
              aria-label={`External link to ${props.href}`}
            />
          ),
          // Override p tag to prevent nesting issues
          p: ({ children }) => <>{children}</>
        }}
      >
        {content}
      </ReactMarkdown>
    );
  } catch (error) {
    console.error('Failed to render markdown:', error);
    return <span className="text-red-500">Error rendering content</span>;
  }
};

// Add a separate SourcesSection component
const SourcesSection: React.FC<{ sources: Array<{title: string, url: string}> }> = ({ sources }) => {
  const [showSources, setShowSources] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const toggleSources = () => {
    setIsAnimating(true);
    setShowSources(!showSources);
  };
  
  return (
    <div className="my-3 text-sm">
      <button 
        onClick={toggleSources}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors border border-blue-200 dark:border-blue-800/50 font-medium shadow-sm"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 20 20" 
          fill="none" 
          className={`w-3.5 h-3.5 transition-transform duration-300 ${showSources ? 'rotate-180' : ''}`}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="10" cy="10" r="7.5" />
          <path d="M3.5 10h13" />
          <path d="M10 2.5c1.94 2.5 3.25 6 3.25 7.5s-1.31 5-3.25 7.5" />
          <path d="M10 2.5C8.06 5 6.75 8.5 6.75 10s1.31 5 3.25 7.5" />
        </svg>
        {showSources ? "Hide sources" : "Web sources"}
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${showSources ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
        onTransitionEnd={() => setIsAnimating(false)}
      >
        <div className="p-3 bg-blue-50 dark:bg-slate-800 rounded-md border border-blue-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">Sources</div>
          <div className="space-y-1.5">
            {sources.map((source, sourceIndex) => (
              <div 
                key={sourceIndex} 
                className="flex items-center transition-opacity duration-300"
                style={{ 
                  opacity: showSources && !isAnimating ? 1 : 0,
                  transitionDelay: `${sourceIndex * 50}ms`
                }}
              >
                <span className="inline-block w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mr-2"></span>
                <a 
                  href={source.url} 
                  className="text-blue-600 dark:text-blue-400 hover:underline text-xs"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {source.title || source.url}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StructuredContent: React.FC<StructuredContentProps> = ({ content }) => {
  if (!content || !Array.isArray(content)) {
    return <div className="text-gray-500 italic">No content available</div>;
  }

  return (
    <div className="structured-content" role="article">
      {content.map((item, index) => {
        try {
          // Paragraph
          if (item.type === 'paragraph' && item.content) {
            return (
              <div key={index} className="my-3 text-base leading-loose tracking-wider">
                <MarkdownContent content={item.content} />
              </div>
            );
          }
          
          // Heading
          if (item.type === 'heading' && item.content && item.level) {
            const HeadingTag = `h${item.level}` as keyof JSX.IntrinsicElements;
            const headingClasses = {
              h1: "text-3xl font-bold mt-6 mb-4 border-b pb-2",
              h2: "text-2xl font-bold mt-4 mb-3 border-b pb-2",
              h3: "text-xl font-semibold mt-3 mb-2",
              h4: "text-lg font-semibold mt-3 mb-2",
              h5: "text-base font-semibold mt-2 mb-1",
              h6: "text-sm font-semibold mt-2 mb-1"
            };
            
            return (
              <HeadingTag 
                key={index} 
                className={headingClasses[`h${item.level}`]}
                id={`heading-${index}`}
              >
                <MarkdownContent content={item.content} />
              </HeadingTag>
            );
          }
          
          // List
          if (item.type === 'list' && item.items) {
            const ListTag = item.style === 'numbered' ? 'ol' : 'ul';
            const listClasses = {
              ol: "list-decimal pl-6 my-2",
              ul: "list-disc pl-6 my-2"
            };
            
            return (
              <ListTag 
                key={index} 
                className={listClasses[ListTag]}
                role={item.style === 'numbered' ? 'list' : 'list'}
              >
                {item.items.map((listItem: string, listItemIndex: number) => (
                  <li key={listItemIndex} className="my-2">
                    <MarkdownContent content={listItem} />
                  </li>
                ))}
              </ListTag>
            );
          }
          
          // Code Block
          if (item.type === 'code' && item.content) {
            return (
              <pre key={index} className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 my-4 overflow-x-auto">
                <code className="text-sm" tabIndex={0}>
                  {item.content}
                </code>
              </pre>
            );
          }
          
          // Blockquote
          if (item.type === 'blockquote' && item.content) {
            return (
              <blockquote 
                key={index} 
                className="border-l-4 pl-4 italic text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md my-4 py-2"
              >
                <MarkdownContent content={item.content} />
              </blockquote>
            );
          }
          
          // Image
          if (item.type === 'image' && item.url) {
            return (
              <figure key={index} className="my-4">
                <Image 
                  src={item.url}
                  alt={item.alt || 'Content image'}
                  className="max-w-full rounded-md"
                  width={600}
                  height={400}
                  loading="lazy"
                  unoptimized={true} // For external images
                  onError={() => {
                    console.error(`Failed to load image: ${item.url}`);
                    // Cannot use onError with Next.js Image, we'll handle fallbacks differently
                  }}
                />
                {item.caption && (
                  <figcaption className="text-sm text-center text-gray-500 mt-1">{item.caption}</figcaption>
                )}
              </figure>
            );
          }
          
          // Sources section
          if (item.type === 'sources' && item.sources) {
            return <SourcesSection key={index} sources={item.sources} />;
          }
          
          // Default case - render as text with error handling
          return <p key={index} className="text-gray-600">{JSON.stringify(item)}</p>;
        } catch (error) {
          console.error('Error rendering content item:', error, item);
          return (
            <div key={index} className="text-red-500 p-2 border border-red-300 rounded-md">
              Failed to render content item
            </div>
          );
        }
      })}
    </div>
  );
};

export default StructuredContent; 