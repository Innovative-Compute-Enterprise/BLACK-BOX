// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { createSearchQuery, performWebSearch } from "./ai/cortex.server";


const searchCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// New function in utils.ts or similar location
export async function WebSearch(query: string, contextMessages = []) {
  const cacheKey = query.trim().toLowerCase();
  const cached = searchCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.results;
  }
  
  try {
    // Reuse your existing search functionality
    const refinedQuery = await createSearchQuery(query, contextMessages);
    const results = await performWebSearch(refinedQuery, contextMessages);
    
    // Cache results
    searchCache.set(cacheKey, { results, timestamp: Date.now() });
    return results;
  } catch (error) {
    console.error("WebSearch function error:", error);
    return [];
  }
}

/**
 * Returns the current date and time information in a structured format
 * This function is used by the AI to provide current temporal information
 */
export function TimeAndDate() {
  const now = new Date();
  
  return {
    iso: now.toISOString(),
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    dateTime: now.toLocaleString(),
    year: now.getFullYear(),
    month: now.getMonth() + 1, // Month is 0-indexed
    day: now.getDate(),
    weekday: now.toLocaleDateString(undefined, { weekday: 'long' }),
    hour: now.getHours(),
    minute: now.getMinutes(),
    second: now.getSeconds(),
    timestamp: now.getTime(),
  };
}

/**
 * Tries to detect and parse JSON in text content
 * @param text The text that might contain JSON
 * @returns The parsed JSON object or null if no valid JSON found
 */
export function tryParseStructuredContent(text: string) {
  try {
    // Check if text appears to be JSON
    if ((text.trim().startsWith('{') && text.trim().endsWith('}')) || 
        (text.trim().startsWith('[') && text.trim().endsWith(']'))) {
      
      const parsed = JSON.parse(text);
      
      // If it's already an array, use it, otherwise wrap it
      const content = Array.isArray(parsed) ? parsed : [parsed];
      
      // Validate that the structure looks like structured content
      if (content.every(item => typeof item === 'object' && item !== null && 'type' in item)) {
        return content;
      }
    }
    
    // Special case: Detect and parse "Sources:" section at the end of the text
    // Support both numbered and unnumbered formats:
    // 1. Numbered: "Sources: 1. [Title](URL), 2. [Title](URL)"
    // 2. Unnumbered: "Sources: [Title](URL), [Title](URL)"
    const sourcesRegex = /(?:^|\n)Sources:[\s\n]+((?:(?:\d+\.\s*)?\[.*?\]\(.*?\)[\s\n]*,?\s*)+)$/;
    const sourcesMatch = text.match(sourcesRegex);
    
    if (sourcesMatch) {
      // Extract the text before the sources section
      const mainContent = text.replace(sourcesRegex, '').trim();
      
      // Parse the sources from the matched pattern
      const sourcesText = sourcesMatch[1];
      
      // Match both numbered and unnumbered formats
      const sourceLinks = sourcesText.match(/(?:\d+\.\s*)?\[(.*?)\]\((.*?)\)/g);
      
      const sources = sourceLinks?.map(link => {
        const titleMatch = link.match(/\[(.*?)\]/);
        const urlMatch = link.match(/\((.*?)\)/);
        const title = titleMatch ? titleMatch[1] : '';
        const url = urlMatch ? urlMatch[1] : '';
        return { title, url };
      }) || [];
      
      // Create structured content with main text and sources
      if (sources.length > 0) {
        // Split main content by paragraphs
        const paragraphs = mainContent.split(/\n\s*\n/).filter(p => p.trim());
        
        // Create structured content with separate paragraph items
        const contentItems = paragraphs.map(p => ({ 
          type: 'paragraph', 
          content: p.trim() 
        }));
        
        return [
          ...contentItems,
          { type: 'sources', sources }
        ];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse structured content:', error);
    return null;
  }
}

/**
 * Cleans up AI responses by removing common artifacts and fixing function references
 * @param text The text response from the AI
 * @returns Cleaned up text
 */
export function cleanAIResponse(text: string): string {
  // Remove "Copy" text that sometimes appears at the end of JSON responses
  let cleanedText = text.replace(/Copy\s*$/i, '').trim();
  
  // Remove markdown code block syntax if it surrounds JSON
  if (cleanedText.startsWith('```json') && cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(7, -3).trim();
  } else if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(3, -3).trim();
  }
  
  // Fix TimeAndDate function calls by replacing them with actual date/time values
  const now = new Date();
  cleanedText = cleanedText
    // Replace TimeAndDate.date() with actual date
    .replace(/TimeAndDate\.date\(\)/g, now.toLocaleDateString())
    // Replace TimeAndDate.time() with actual time
    .replace(/TimeAndDate\.time\(\)/g, now.toLocaleTimeString())
    // Replace TimeAndDate.year() with actual year
    .replace(/TimeAndDate\.year\(\)/g, now.getFullYear().toString())
    // Replace other variants
    .replace(/TimeAndDate\(.*?\)/g, now.toLocaleString())
    .replace(/TimeAndDate/g, now.toLocaleString());
  
  // Format cryptocurrency price references for better readability
  cleanedText = cleanedText
    // Ensure Bitcoin is capitalized
    .replace(/bitcoin/gi, 'Bitcoin')
    // Ensure USD formatting is consistent
    .replace(/(\$\d+[,\d]*)(\.?\d*)( USD)/gi, '$1$2')
    .replace(/(\d+[,\d]*)(\.?\d*) (USD|dollars)/gi, '$$$1$2');
  
  return cleanedText;
}
