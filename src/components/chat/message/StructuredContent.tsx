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
  // Add potential table structure if needed in the future
  headers?: string[];
  rows?: string[][];
}

// Define the type for the markdown components object
type MarkdownComponentType = React.ComponentType<any> | keyof JSX.IntrinsicElements;
type MarkdownComponents = { [key: string]: MarkdownComponentType };

interface StructuredContentProps {
  content: StructuredContentItem[];
  // Accept markdown components as a prop
  markdownComponents?: MarkdownComponents;
}

// Reusable Markdown component with consistent styling and error handling
// Updated to accept and use markdownComponents prop
const MarkdownContent: React.FC<{ content: string; components?: MarkdownComponents }> = ({ content, components }) => {
  try {
    // Merge default overrides with passed components
    const mergedComponents: MarkdownComponents = {
      // Default link styling
      a: (props) => (
        <a 
          {...props} 
          className="text-blue-600 dark:text-blue-400 hover:underline"
          target="_blank" 
          rel="noopener noreferrer"
          aria-label={`External link to ${props.href}`}
        />
      ),
      // Override p tag to prevent nesting issues when markdown is inside other elements,
      // but only if no specific p component is passed in.
      ...(!components?.p && { p: ({ children }) => <>{children}</> }),
      // Include passed components, potentially overriding defaults if keys match
      ...(components || {}),
    };

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        // Use the merged components which includes styles from MessageBubble
        components={mergedComponents}
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

// Pass markdownComponents prop down
const StructuredContent: React.FC<StructuredContentProps> = ({ content, markdownComponents }) => {
  if (!content || !Array.isArray(content)) {
    return <div className="text-gray-500 italic">No content available</div>;
  }

  // No need to extract components here, MarkdownContent handles it

  return (
    <div className="structured-content" role="article">
      {content.map((item, index) => {
        try {
          // Paragraph: Pass markdownComponents to MarkdownContent
          if (item.type === 'paragraph' && item.content) {
            // Use a simple div wrapper. Styling is handled by MarkdownContent
            return (
              <div key={index}>
                {/* Pass components down */}
                <MarkdownContent content={item.content} components={markdownComponents} />
              </div>
            );
          }
          
          // Heading: Pass markdownComponents to MarkdownContent
          if (item.type === 'heading' && item.content && item.level) {
            // Use a simple div wrapper. Styling is handled by MarkdownContent
            return (
              <div key={index}>
                {/* Pass components down */}
                <MarkdownContent content={item.content} components={markdownComponents} />
              </div>
            );
          }
          
          // List: Pass markdownComponents to MarkdownContent
          if (item.type === 'list' && item.items) {
             // Use a simple div wrapper. Styling is handled by MarkdownContent
             // We just need to format the markdown correctly here
             const listMarkdown = item.items.map((listItem, i) => {
               const prefix = item.style === 'numbered' ? `${i + 1}.` : '*';
               return `${prefix} ${listItem}`;
             }).join('\n');

            return (
              <div key={index}>
                {/* Pass components down */}
                <MarkdownContent content={listMarkdown} components={markdownComponents} />
              </div>
            );
          }
          
          // Code Block: Pass markdownComponents to MarkdownContent
          if (item.type === 'code' && item.content) {
             // Use a simple div wrapper. Styling is handled by MarkdownContent
            return (
              <div key={index}>
                 {/* Pass components down, wrap content in markdown code syntax */}
                <MarkdownContent content={`\`\`\`\n${item.content}\n\`\`\``} components={markdownComponents} />
              </div>
            );
          }
          
          // Blockquote: Pass markdownComponents to MarkdownContent
          if (item.type === 'blockquote' && item.content) {
             // Use a simple div wrapper. Styling is handled by MarkdownContent
             // Prepend blockquote markdown syntax
            const blockquoteMarkdown = item.content.split('\n').map(line => `> ${line}`).join('\n');
            return (
              <div key={index}>
                {/* Pass components down */}
                <MarkdownContent content={blockquoteMarkdown} components={markdownComponents} />
              </div>
            );
          }
          
          // Image: Render directly, potentially using passed img component via MarkdownContent
          if (item.type === 'image' && item.url) {
            // Format as markdown image and let MarkdownContent handle it
            const imageMarkdown = `![${item.alt || 'Content image'}](${item.url})`;
            return (
              <figure key={index} className="my-5"> {/* Keep figure for semantics */}
                {/* Pass components down */}
                <MarkdownContent content={imageMarkdown} components={markdownComponents} />
                {item.caption && (
                  <figcaption className="text-sm text-center text-gray-600 dark:text-gray-400 mt-2">{item.caption}</figcaption>
                )}
              </figure>
            );
          }
          
          // Sources section (Render directly as before)
          if (item.type === 'sources' && item.sources) {
            return <SourcesSection key={index} sources={item.sources} />;
          }
          
          // Horizontal Rule: Let MarkdownContent handle it
          if (item.type === 'horizontal_rule') {
            return (
              <div key={index}>
                 {/* Pass components down */}
                <MarkdownContent content="---" components={markdownComponents} />
               </div>
            );
          }

          // Fallback for unknown types
          console.warn("Unknown structured content item type:", item.type, item);
          return (
             <div key={index}>
               {/* Render potentially unknown content using MarkdownContent with styles */}
               <MarkdownContent content={item.content || JSON.stringify(item)} components={markdownComponents} />
             </div>
          );
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