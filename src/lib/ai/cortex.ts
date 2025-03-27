// src/lib/ai/cortex.ts
import { modelsConfig } from './models'; 
import { Message } from '@/src/types/chat';
import { TimeAndDate } from '@/src/lib/utils';
import { performWebSearch } from '@/src/lib/ai/cortex.server';
import { defaultCustomInstructions } from '@/src/lib/ai/prompts';

// Re-export your types if needed
export type AIModelConfig = {
  id: string;
  name: string;
  description: string;
  acceptsFiles: boolean;
  acceptsCustomInstructions?: boolean;
  handler: ModelHandler;
  systemPrompt: (context: { selectedChatModel: string }) => string;
};

// The model handler now passes systemPrompt and context to API
export type ModelHandler = (
  messages: Message[], 
  systemPrompt: string, 
  context?: any[],
  files?: any[]
) => Promise<Message>;

// Create WebSearch manager for caching and optimization
const createWebSearchManager = () => {
  const searchCache = new Map();
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes default

  // Process search results into a standard format
  const formatSearchResults = (results: any[]) => {
    return results.map(result => ({
      title: result.title,
      snippet: result.snippet,
      url: result.url
    }));
  };

  // Main WebSearch function that will be exposed to the AI
  const webSearch = async (query: string, messages: Message[] = []) => {
    if (!query || query.trim() === '') {
      console.log('[WebSearch] Empty query, returning empty results');
      return { results: [], query: '', timestamp: Date.now() };
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = normalizedQuery;
    
    // Check cache first
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[WebSearch] Using cached results for: ${normalizedQuery}`);
      return cached;
    }

    try {
      console.log(`[WebSearch] Performing search for: ${normalizedQuery}`);
      const results = await performWebSearch(query, messages);
      
      // Always return a properly structured response, even with empty results
      const searchData = {
        results: results ? formatSearchResults(results) : [],
        query: query,
        timestamp: Date.now()
      };
      
      console.log(`[WebSearch] Search completed with ${searchData.results.length} results`);
      
      // Cache the results
      searchCache.set(cacheKey, searchData);
      return searchData;
    } catch (error) {
      console.error(`[WebSearch] Error searching for: ${normalizedQuery}`, error);
      // Still return a valid response structure even on error
      return { 
        results: [], 
        query, 
        timestamp: Date.now(), 
        error: true,
        errorMessage: error.message
      };
    }
  };

  return {
    search: webSearch,
    clearCache: () => searchCache.clear()
  };
};

export function cortex() {
  const modelConfigMap: Record<string, AIModelConfig> = modelsConfig.reduce((map, model) => {
    map[model.id] = model;
    return map;
  }, {});

  // Create the web search manager
  const webSearchManager = createWebSearchManager();

  const getModelConfig = (modelId: string): AIModelConfig | undefined => {
    return modelConfigMap[modelId];
  };

  const getModelList = (): AIModelConfig[] => {
    return modelsConfig;
  };

  const getModelHandler = (modelId: string): ModelHandler | null => {
    const config = getModelConfig(modelId);
    return config ? config.handler : null;
  };

  const getSystemPrompt = (context: { selectedChatModel: string }): string => {
    const config = getModelConfig(context.selectedChatModel);
    const prompt = config ? config.systemPrompt(context) : '';
    
    // Log system prompt generation details
    console.log('[CORTEX] Generated system prompt for model:', context.selectedChatModel, {
      promptLength: prompt.length,
      hasCustomInstructions: prompt.includes(defaultCustomInstructions) ? 'default' : 'custom'
    });
    
    return prompt;
  };

  const canHandleFiles = (modelId: string): boolean => {
    const config = getModelConfig(modelId);
    return !!config?.acceptsFiles;
  };

  // Enhanced context data with WebSearch capability
  const getContextData = () => {
    return {
      TimeAndDate: TimeAndDate(),
      // Provide WebSearch as metadata - actual search is performed by handlePost
      WebSearch: {
        available: true,
        performed: false,
        resultsFound: false,
        query: '',
      }
    };
  };

  // New method to perform actual searches
  const performSearch = async (query: string, messages: Message[] = []) => {
    return await webSearchManager.search(query, messages);
  };


  return {
    models: getModelList,
    getModelConfig,
    getModelHandler,
    getSystemPrompt,
    canHandleFiles,
    getContextData,
    performSearch,     // Expose the search functionality
  };
}

export const chatCortex = cortex();