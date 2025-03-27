// lib/ai/prompts.ts
export const cortex = `
**Built-in Functions Available:**
- Current date and time information is always available through \`TimeAndDate\`.
- NEVER return TimeAndDate as a literal string or code snippet. Use the actual values already provided in context.
- NEVER use syntax like TimeAndDate.date() or other method calls. The TimeAndDate object is already expanded for you with its values.
- When referring to the current date, directly use phrases like "Today is March 19, 2025" (using the actual current date).

**When using web search results:**
- ALWAYS use the information from search results to directly answer the user's question
- Extract specific facts, data, and details from the search results
- For time-sensitive questions (prices, weather, current events), prioritize providing the most current information
- When answering financial or cryptocurrency price questions:
  - Clearly state the exact price with the currency symbol
  - Include the percentage change if available
  - Specify when this price information was retrieved
  - Never fabricate price data - only use what is in the search results
- Add a "Sources" section at the end of your response with relevant source links
- DO NOT include numbered citations like [1], [2], etc. in your response text
- Format sources using Markdown link syntax: "Sources: [Source Name](URL)"
- Use the source title provided in the search results, not the full URL
- Example format (correct): 
  Sources: [Google Finance](https://www.google.com/finance)
- Example format (incorrect): 
  Sources: https://www.google.com/finance/quote/BTC-USD?sa=X&ved=2ahUKEwighKLvkZeMAxVEsIYBHW-JIwMQ-fUHegQIPRAX
`;

export const defaultCustomInstructions = "You are a friendly assistant! Keep your responses concise, clear, and helpful.";

// Add a global variable to track the latest custom instructions in memory
let latestCustomInstructions = defaultCustomInstructions;

// Function to get custom instructions from localStorage or use the default
export const getCustomInstructions = (): string => {
  if (typeof window !== 'undefined') {
    // First check memory cache (which is updated by events)
    if (latestCustomInstructions !== defaultCustomInstructions) {
      console.log('[DEBUG getCustomInstructions] Using in-memory instructions:', 
        latestCustomInstructions.substring(0, 30) + '...');
      return latestCustomInstructions;
    }
    
    // Then check localStorage
    const stored = localStorage.getItem('custom-instructions');
    if (stored) {
      // Important: Always update in-memory cache when loading from localStorage
      latestCustomInstructions = stored;
      console.log('[DEBUG getCustomInstructions] Using localStorage instructions:', 
        stored.substring(0, 30) + '...');
      return stored;
    }
  }
  console.log('[DEBUG getCustomInstructions] Using default instructions');
  return defaultCustomInstructions;
};

// Function to update custom instructions in localStorage
export const updateCustomInstructions = (instructions: string): void => {
  if (typeof window !== 'undefined') {
    // Update both localStorage and our in-memory cache
    localStorage.setItem('custom-instructions', instructions);
    
    // Important: Force direct update of the in-memory value first
    latestCustomInstructions = instructions;
    
    console.log('[DEBUG updateCustomInstructions] Updated custom instructions:', {
      instructions: instructions.substring(0, 30) + '...',
      inMemoryUpdated: latestCustomInstructions === instructions,
      localStorageUpdated: localStorage.getItem('custom-instructions') === instructions
    });
    
    // Dispatch a custom event for other components to listen to
    const event = new CustomEvent('custom-instructions-updated', { 
      detail: { instructions } 
    });
    window.dispatchEvent(event);
    
    console.log('[prompts] Custom instructions updated and event dispatched');
  }
};

export const getSystemPrompt = (context: { selectedChatModel: string }) => {
  const { selectedChatModel } = context;
  if (selectedChatModel === "chat-model-reasoning") return cortex;
  
  // Check first from localStorage directly to bypass any stale in-memory cache
  let customInstructions = '';
  
  if (typeof window !== 'undefined') {
    // First try to get directly from localStorage - most reliable source
    const storedInstructions = localStorage.getItem('custom-instructions');
    
    if (storedInstructions) {
      // If localStorage has instructions, use them and update the cache
      customInstructions = storedInstructions;
      latestCustomInstructions = storedInstructions; // Sync in-memory cache
    } else {
      // If nothing in localStorage, fall back to in-memory or default
      customInstructions = latestCustomInstructions;
    }
  } else {
    // Server-side or no window object - use the in-memory cache
    customInstructions = latestCustomInstructions;
  }
  
  // Log detailed information about the custom instructions
  console.log('[DEBUG getSystemPrompt] Using custom instructions:', {
    length: customInstructions.length,
    preview: customInstructions.substring(0, 50) + (customInstructions.length > 50 ? '...' : ''),
    directFromStorage: typeof window !== 'undefined' ? 
      (localStorage.getItem('custom-instructions') === customInstructions) : false,
    isDefault: customInstructions === defaultCustomInstructions,
    model: selectedChatModel
  });
  
  return `${cortex}\n\n${customInstructions}`;
};

// Set up event listener to update in-memory cache when instructions change
if (typeof window !== 'undefined') {
  window.addEventListener('custom-instructions-updated', ((e: CustomEvent) => {
    if (e.detail && e.detail.instructions) {
      const oldValue = latestCustomInstructions;
      latestCustomInstructions = e.detail.instructions;
      console.log('[DEBUG event] Updated instructions in memory via custom event:', {
        before: oldValue.substring(0, 30) + '...',
        after: latestCustomInstructions.substring(0, 30) + '...',
        changed: oldValue !== latestCustomInstructions
      });
    }
  }) as EventListener);
  
  // Also listen for storage events from other tabs
  window.addEventListener('storage', (e) => {
    if (e.key === 'custom-instructions' && e.newValue) {
      const oldValue = latestCustomInstructions;
      latestCustomInstructions = e.newValue;
      console.log('[DEBUG storage] Updated instructions in memory via storage event:', {
        before: oldValue.substring(0, 30) + '...',
        after: latestCustomInstructions.substring(0, 30) + '...',
        changed: oldValue !== latestCustomInstructions
      });
    }
  });
}

// For backward compatibility
export const customInstructions = defaultCustomInstructions;