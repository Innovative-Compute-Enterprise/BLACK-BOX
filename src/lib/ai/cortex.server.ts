"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "@/src/types/chat";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;

// Debug logging function
const debugLog = (message, data) => {
  console.log(`DEBUG: ${message}`, JSON.stringify(data, null, 2));
};

// Check API keys on initialization
(() => {
  if (!GEMINI_API_KEY) {
    console.error("ERROR: GOOGLE_API_KEY is not set in environment variables!");
  }
  if (!SERPAPI_API_KEY) {
    console.error("ERROR: SERPAPI_API_KEY is not set in environment variables!");
  }
})();

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "dummy_key_for_init");

const searchCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * This function calls the Gemini API to generate a chat title.
 */
export async function generateChatTitle(messages: Message[]): Promise<string> {
  const defaultTitle = "New Chat";
  
  // Validate input
  if (!messages || messages.length === 0) {
    debugLog("No messages provided to generateChatTitle", { messages });
    return defaultTitle;
  }

  // Validate message format
  const validMessages = messages.every(message => 
    message.role && Array.isArray(message.content)
  );
  
  if (!validMessages) {
    debugLog("Invalid message format in generateChatTitle", { 
      sample: messages.slice(0, 2) 
    });
    return defaultTitle;
  }

  // Validate API key
  if (!GEMINI_API_KEY) {
    debugLog("Missing GOOGLE_API_KEY in generateChatTitle", {});
    return defaultTitle;
  }

  const chatContext = messages
    .slice(-3)
    .map((message) => {
      const content = message.content
        .map((c) => (c.type === "text" ? c.text : "[Image]"))
        .join(" ");
      return `${message.role}: ${content}`;
    })
    .join("\n");

  debugLog("Chat context for title generation", { chatContext });

  const prompt = `
    You are an AI assistant that creates concise and obvious titles for chat sessions.
    Based on the following conversation history, generate a short and relevant title:
    ---
    ${chatContext}
    ---
    Title:
  `;

  // Add timeout to prevent hanging on API calls
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {      
    debugLog("Calling Gemini API for title generation", {
      model: "gemini-2.0-flash-001",
      promptLength: prompt.length
    });
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.5
      }
    });

    clearTimeout(timeoutId);
    
    const generatedTitle = result.response.text().trim();
    
    debugLog("Title generation result", { generatedTitle });
    
    if (!generatedTitle) {
      throw new Error("No title received from API");
    }
    
    return generatedTitle;
  } catch (apiError) {
    clearTimeout(timeoutId);
    console.error("API error generating chat title:", apiError);
    debugLog("Title generation error details", { 
      error: apiError.toString(),
      stack: apiError.stack
    });
    return defaultTitle;
  }
} 

/**
 * Uses the LLM to refine the raw user query into an optimal search query.
 */
export async function createSearchQuery(
  userQuery: string,
  messages: Message[]
): Promise<string> {
  debugLog("Starting createSearchQuery", { userQuery });
  
  // Validate input
  if (!userQuery || userQuery.trim() === '') {
    debugLog("Empty query in createSearchQuery", {});
    return '';
  }
  
  // Validate API key
  if (!GEMINI_API_KEY) {
    debugLog("Missing GOOGLE_API_KEY in createSearchQuery", {});
    return userQuery;
  }

  try {
    // Add timeout to prevent hanging on API calls
    const controller = new AbortController();
    let timeoutId = setTimeout(() => {
      controller.abort();
      timeoutId = null;
    }, 5000);

    try {
      const optimizedMessages = messages.slice(-5).map(message => ({
        role: message.role,
        content: message.content
          .map(c => c.type === 'text' ? c.text : '[Image]')
          .join(' ')
      }));

      const chatContext = optimizedMessages
        .map((message) => `${message.role}: ${message.content}`)
        .join("\n");

      debugLog("Chat context for search query optimization", { 
        contextLength: chatContext.length
      });

      const prompt = `
      You are an expert search query optimizer. Your task is to create the MOST NEUTRAL and EFFECTIVE search query 
      for finding CURRENT and ACCURATE information based on the conversation.
      
      Guidelines:
      1. DO NOT ASSUME ANY SPECIFIC ANSWERS in your query
      2. Avoid mentioning specific people unless they are explicitly part of the question
      3. Focus on the core information need, not previous answers
      4. For questions about current officeholders, leaders, or statistics, create a neutral query
      5. Use quotes only for exact phrases that must appear together
      6. Remove filler words and focus on key terms
      7. If the latest message is a follow-up, consider both it AND the previous message
      
      Examples:
      - "who is the president of usa" → "current president united states"
      - "are you sure?" (after asking about the president) → "current president united states 2025"
      - "what is the capital of france" → "capital france"
      
      Conversation Context:
      ${chatContext}
      
      Original Query: "${userQuery}"
      
      Optimized Search Query (ONLY return the query itself, no explanation):
      `;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-001" });

      debugLog("Calling Gemini API for search query optimization", {
        model: "gemini-2.0-flash-lite-001",
        promptLength: prompt.length
      });

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7
        }
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const refinedQuery = result.response.text().trim();
      
      debugLog("Search query optimization result", { refinedQuery });
      
      if (!refinedQuery) {
        throw new Error("No refined query generated from API");
      }
      
      return refinedQuery;
    } catch (apiError) {
      console.error("API error in search query optimization:", apiError);
      debugLog("Search query optimization error details", { 
        error: apiError.toString(),
        stack: apiError.stack
      });
      return userQuery; // Fallback to original query on API error
    }
  } catch (error) {
    console.error("Error generating optimized search query:", error);
    debugLog("General error in createSearchQuery", { 
      error: error.toString(),
      stack: error.stack
    });
    return userQuery; // Fallback to original query
  }
}

/**
 * Performs a real web search using the Google Custom Search API with optimizations
 * including caching, timeout handling, and context optimization.
 */
export async function performWebSearch(
  query: string,
  messages: Message[]
): Promise<{ title: string; snippet: string; url: string }[]> {
  debugLog("Starting performWebSearch", { query });
  
  try {
    // Check if query is empty
    if (!query || query.trim() === '') {
      debugLog("Empty query in performWebSearch", {});
      return [];
    }

    // Verify SerpAPI key
    if (!SERPAPI_API_KEY) {
      debugLog("Missing SERPAPI_API_KEY in performWebSearch", {});
      console.error("ERROR: SERPAPI_API_KEY is not set in environment variables!");
      throw new Error("SERPAPI_API_KEY not set in environment");
    }

    debugLog("SERPAPI_API_KEY found, continuing search", {
      keyStartsWith: SERPAPI_API_KEY.substring(0, 3) + '...',
      keyLength: SERPAPI_API_KEY.length
    });

    // Generate cache key from query and optimized message context
    const cacheKey = query + messages.slice(-3).map(m => 
      m.content.map(c => c.type === 'text' ? c.text : '[Image]').join(' ')
    ).join('');
    
    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      debugLog("Returning cached search results", { 
        query,
        resultsCount: cached.results.length 
      });
      return cached.results;
    }

    // Always use the original query as a fallback and try to refine if possible
    let refinedQuery = query;
    try {
      debugLog("Attempting to refine search query", { originalQuery: query });
      refinedQuery = await createSearchQuery(query, messages);
      debugLog("Query refinement result", { 
        originalQuery: query, 
        refinedQuery 
      });
    } catch (error) {
      console.warn("Using original query due to refinement error");
      debugLog("Query refinement failed", { 
        error: error.toString() 
      });
      // Continue with original query
    }

    // Setup timeout for the search request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); 

    try {
      const endpoint = "https://serpapi.com/search";
      const url = `${endpoint}?q=${encodeURI(refinedQuery)}&api_key=${SERPAPI_API_KEY}&num=9`;
      
      debugLog("Making SerpAPI request", { 
        endpoint,
        queryLength: refinedQuery.length,
        hasApiKey: !!SERPAPI_API_KEY
      });
            
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      debugLog("SerpAPI response status", { 
        status: res.status,
        statusText: res.statusText
      });

      if (!res.ok) {
        const errorBody = await res.text();
        debugLog("SerpAPI error response", { 
          status: res.status,
          statusText: res.statusText,
          errorBody
        });      
        throw new Error(`SerpAPI error: ${res.status} ${res.statusText} - ${errorBody}`);
      }

      const data = await res.json();
      
      // Debug full response structure for better understanding
      debugLog("SerpAPI response data structure", {
        hasOrganic: !!data.organic_results,
        hasKnowledgeGraph: !!data.knowledge_graph,
        hasAnswerBox: !!data.answer_box,
        hasTopStories: !!data.top_stories,
        dataKeys: Object.keys(data)
      });
      
      let results = [];
      
      // Helper function to clean URLs by removing tracking parameters
      const cleanUrl = (url: string): string => {
        try {
          // Parse the URL
          const parsedUrl = new URL(url);
          
          // Remove tracking parameters (common ones like utm_, ref, sa, ved, etc.)
          const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 
                                 'utm_content', 'ref', 'sa', 'ved', 'usg', 'ei', 'bih', 
                                 'biw', 'source_id', 'fbclid', 'ref_', 'gclid', '_ga', 
                                 'yclid', 'msclkid'];
          
          // Create a new URLSearchParams object
          const cleanParams = new URLSearchParams();
          
          // Only keep essential parameters
          for (const [key, value] of parsedUrl.searchParams.entries()) {
            if (!paramsToRemove.some(param => key.startsWith(param))) {
              cleanParams.append(key, value);
            }
          }
          
          // Reconstruct the URL with clean parameters
          let cleanUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`;
          
          // Only add search params if there are any left
          const cleanParamsString = cleanParams.toString();
          if (cleanParamsString) {
            cleanUrl += `?${cleanParamsString}`;
          }
          
          return cleanUrl;
        } catch (e) {
          // If URL parsing fails, return the original URL
          console.warn("Error cleaning URL:", e);
          return url;
        }
      };

      // Special handling for cryptocurrency prices
      if (
        refinedQuery.toLowerCase().includes("bitcoin") || 
        refinedQuery.toLowerCase().includes("btc") || 
        refinedQuery.toLowerCase().includes("crypto")
      ) {
        // Try to extract from knowledge graph first
        if (data.knowledge_graph) {
          const kg = data.knowledge_graph;
          const priceInfo = kg.price || kg.value || '';
          
          if (priceInfo) {
            // Extract domain for source title
            let sourceUrl = kg.source || "https://www.google.com/search?q=" + encodeURI(refinedQuery);
            sourceUrl = cleanUrl(sourceUrl);
            
            // Create a better title for the source
            let sourceTitle = "Bitcoin Price Data";
            try {
              const urlObj = new URL(sourceUrl);
              sourceTitle = urlObj.hostname.replace(/^www\./, '');
              // Capitalize first letter of each word
              sourceTitle = sourceTitle.split('.')[0]
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            } catch (e) {
              // Keep default title on error
            }
            
            results = [{
              title: `${kg.title || kg.name || "Bitcoin"} Price`,
              snippet: `Current price: ${priceInfo}. ${kg.description || ''}`,
              url: sourceUrl,
              sourceTitle: sourceTitle
            }];
            
            debugLog("Cryptocurrency price found in knowledge graph", { priceInfo, sourceTitle, sourceUrl });
            
            // If we found the price info, return it immediately
            searchCache.set(cacheKey, { results, timestamp: Date.now() });
            return results;
          }
        }
        
        // Try answer box next
        if (data.answer_box) {
          const ab = data.answer_box;
          const priceInfo = ab.answer || ab.result || '';
          
          if (priceInfo) {
            // Extract domain for source title
            let sourceUrl = ab.link || "https://www.google.com/search?q=" + encodeURI(refinedQuery);
            sourceUrl = cleanUrl(sourceUrl);
            
            // Create a better title for the source
            let sourceTitle = "Bitcoin Price Data";
            try {
              const urlObj = new URL(sourceUrl);
              sourceTitle = urlObj.hostname.replace(/^www\./, '');
              // Capitalize first letter of each word
              sourceTitle = sourceTitle.split('.')[0]
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            } catch (e) {
              // Keep default title on error
            }
            
            results = [{
              title: `${ab.title || "Bitcoin"} Price`,
              snippet: `Current price: ${priceInfo}`,
              url: sourceUrl,
              sourceTitle: sourceTitle
            }];
            
            debugLog("Cryptocurrency price found in answer box", { priceInfo, sourceTitle, sourceUrl });
            
            // If we found the price info, return it immediately
            searchCache.set(cacheKey, { results, timestamp: Date.now() });
            return results;
          }
        }
        
        // Last try - look through all top-level properties
        for (const key of Object.keys(data)) {
          // Look for property names that might contain price data
          if (
            key.toLowerCase().includes("price") || 
            key.toLowerCase().includes("cryptocurrency") || 
            key.toLowerCase().includes("financial")
          ) {
            const potentialPriceData = data[key];
            
            if (potentialPriceData && typeof potentialPriceData === 'object') {
              debugLog("Found potential cryptocurrency price data", { key, data: JSON.stringify(potentialPriceData).substring(0, 200) });
              
              // Try to extract price information
              let priceInfo = '';
              if (typeof potentialPriceData.price === 'string') {
                priceInfo = potentialPriceData.price;
              } else if (typeof potentialPriceData.value === 'string') {
                priceInfo = potentialPriceData.value;
              } else if (typeof potentialPriceData.current_value === 'string') {
                priceInfo = potentialPriceData.current_value;
              }
              
              if (priceInfo) {
                results = [{
                  title: "Bitcoin Price",
                  snippet: `Current price: ${priceInfo}`,
                  url: "https://www.google.com/search?q=" + encodeURI(refinedQuery)
                }];
                
                // If we found the price info, return it immediately
                searchCache.set(cacheKey, { results, timestamp: Date.now() });
                return results;
              }
            }
          }
        }
      }
      
      // First check for organic results
      if (data.organic_results && data.organic_results.length > 0) {
        results = data.organic_results.map((item) => {
          let sourceUrl = cleanUrl(item.link);
          
          // Create a sensible source title from the domain if title is too long
          let sourceTitle = item.title;
          if (sourceTitle.length > 40) {
            try {
              const urlObj = new URL(sourceUrl);
              sourceTitle = urlObj.hostname.replace(/^www\./, '');
              // Capitalize first letter of each word
              sourceTitle = sourceTitle.split('.')[0]
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            } catch (e) {
              // Keep original title on error
            }
          }
          
          return {
            title: item.title,
            snippet: item.snippet,
            url: sourceUrl,
            sourceTitle: sourceTitle
          };
        });
      } 
      // If no organic results but there's a knowledge graph, use that
      else if (data.knowledge_graph) {
        const kg = data.knowledge_graph;
        let sourceUrl = cleanUrl(kg.source || kg.website || "https://www.google.com/search?q=" + encodeURI(refinedQuery));
        
        // Create a better title for the source
        let sourceTitle = kg.title || kg.name || "Knowledge Graph";
        if (sourceTitle.length > 40) {
          try {
            const urlObj = new URL(sourceUrl);
            sourceTitle = urlObj.hostname.replace(/^www\./, '');
            sourceTitle = sourceTitle.split('.')[0]
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          } catch (e) {
            // Keep default title on error
          }
        }
        
        results = [{
          title: kg.title || kg.name || "Knowledge Graph Result",
          snippet: kg.description || kg.snippet || Object.entries(kg)
            .filter(([key]) => !['title', 'name', 'type', 'source', 'stick'].includes(key))
            .map(([key, value]) => `${key}: ${value}`).join('. '),
          url: sourceUrl,
          sourceTitle: sourceTitle
        }];
      }
      // If there's an answer box, use that
      else if (data.answer_box) {
        const ab = data.answer_box;
        let sourceUrl = cleanUrl(ab.link || "https://www.google.com/search?q=" + encodeURI(refinedQuery));
        
        // Create a better title for the source
        let sourceTitle = ab.title || "Answer Box";
        if (sourceTitle.length > 40) {
          try {
            const urlObj = new URL(sourceUrl);
            sourceTitle = urlObj.hostname.replace(/^www\./, '');
            sourceTitle = sourceTitle.split('.')[0]
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          } catch (e) {
            // Keep default title on error
          }
        }
        
        results = [{
          title: ab.title || "Answer Box Result",
          snippet: ab.answer || ab.snippet || ab.result || "Information found but no detailed snippet available.",
          url: sourceUrl,
          sourceTitle: sourceTitle
        }];
      }
      // Check for top stories
      else if (data.top_stories && data.top_stories.length > 0) {
        results = data.top_stories.map(story => {
          let sourceUrl = cleanUrl(story.link);
          
          // Create a sensible source title from the domain if title is too long
          let sourceTitle = story.title;
          if (sourceTitle.length > 40) {
            try {
              const urlObj = new URL(sourceUrl);
              sourceTitle = urlObj.hostname.replace(/^www\./, '');
              // Capitalize first letter of each word
              sourceTitle = sourceTitle.split('.')[0]
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            } catch (e) {
              // Keep original title on error
            }
          }
          
          return {
            title: story.title,
            snippet: story.snippet || story.source,
            url: sourceUrl,
            sourceTitle: sourceTitle
          };
        });
      }
      
      if (results.length === 0) {
        debugLog("No results extracted from SerpAPI response", {
          dataKeys: Object.keys(data)
        });
        return [];
      }
      
      debugLog("Search results processed", { 
        query: refinedQuery,
        resultsCount: results.length,
        resultSource: data.organic_results ? "organic_results" : 
                     data.knowledge_graph ? "knowledge_graph" : 
                     data.answer_box ? "answer_box" :
                     data.top_stories ? "top_stories" : "unknown"
      });
      
      // Cache the results
      searchCache.set(cacheKey, { results, timestamp: Date.now() });
      return results;

    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        debugLog("SerpAPI request timed out", {});
        return [];
      }
      throw error;
    }
  } catch (error) {
    console.error("Error performing web search:", error);
    debugLog("General error in performWebSearch", { 
      error: error.toString(),
      stack: error.stack
    });
    return [];
  }
}