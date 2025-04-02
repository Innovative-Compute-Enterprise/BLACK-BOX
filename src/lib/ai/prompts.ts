// lib/ai/prompts.ts
import { type Message } from "ai";

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

// --- Constants for localStorage keys (Ensure these match chat-settings.tsx) ---
const PERSONALITIES_STORAGE_KEY = 'custom-personalities';
const ACTIVE_PERSONALITY_NAME_KEY = 'active-personality-name';
const DEFAULT_PERSONALITY_NAME = 'Default'; // Default name if nothing else is found

// --- Personality Type (Ensure this matches chat-settings.tsx) ---
interface Personality {
  name: string;
  instructions: string;
}
// --- End Personality Type ---

/**
 * Retrieves the custom instructions for the currently active personality.
 * Reads the active personality name and the list of personalities from localStorage.
 * Falls back to default empty instructions if not found or on error.
 */
export const getCustomInstructions = (): string => {
  if (typeof window === 'undefined') return ''; // Return empty string in SSR

  try {
    const activeName = localStorage.getItem(ACTIVE_PERSONALITY_NAME_KEY) || DEFAULT_PERSONALITY_NAME;
    const personalitiesStr = localStorage.getItem(PERSONALITIES_STORAGE_KEY);
    const personalities: Personality[] = personalitiesStr ? JSON.parse(personalitiesStr) : [];
    
    const activePersonality = personalities.find(p => p.name === activeName);

    if (activePersonality) {
        console.log(`[Prompts] Loaded instructions for active personality: ${activeName}`)
        return activePersonality.instructions;
    } else {
        // If active name not found in list, maybe return default or first personality?
        // Returning default personality if it exists, otherwise empty.
        const defaultPersonality = personalities.find(p => p.name === DEFAULT_PERSONALITY_NAME);
         console.log(`[Prompts] Active personality '${activeName}' not found. Falling back.`);
        return defaultPersonality?.instructions || '';
    }

  } catch (error) {
    console.error("Error retrieving custom instructions:", error);
    return ''; // Fallback to empty string on error
  }
};

/**
 * NOTE: This function is no longer used directly by the Settings component 
 * for personalities. Saving is handled within the component itself using
 * the savePersonalities helper.
 * Kept here for potential other uses or reference.
 */
export const updateCustomInstructions = (instructions: string) => {
  // This function might need rethinking if used elsewhere, as it assumes a single
  // instruction string. For personalities, use the logic within chat-settings.tsx.
  console.warn("[Prompts] updateCustomInstructions was called, but personality management handles saving differently now.");
  // if (typeof window !== 'undefined') {
  //   try {
  //     // Example: Could potentially update the 'Default' personality?
  //     // localStorage.setItem('custom-instructions', instructions);
  //   } catch (error) {
  //     console.error("Error updating custom instructions:", error);
  //   }
  // }
};

// Old getSystemPrompt using single instruction key - Remove or replace
// export const getSystemPrompt = (context: { selectedChatModel: string }) => {
//   const { selectedChatModel } = context;
//   if (selectedChatModel === "chat-model-reasoning") return cortex;
//   
//   // Check first from localStorage directly to bypass any stale in-memory cache
//   let customInstructions = '';
//   
//   if (typeof window !== 'undefined') {
//     // First try to get directly from localStorage - most reliable source
//     const storedInstructions = localStorage.getItem('custom-instructions');
//     
//     if (storedInstructions) {
//       // If localStorage has instructions, use them and update the cache
//       customInstructions = storedInstructions;
//       // latestCustomInstructions = storedInstructions; // Sync in-memory cache
//     } else {
//       // If nothing in localStorage, fall back to default (no in-memory needed here)
//       customInstructions = defaultCustomInstructions;
//     }
//   } else {
//     // Server-side or no window object - use the default
//     customInstructions = defaultCustomInstructions;
//   }
//   
//   // Log detailed information about the custom instructions
//   console.log('[DEBUG getSystemPrompt] Using custom instructions:', {
//     length: customInstructions.length,
//     preview: customInstructions.substring(0, 50) + (customInstructions.length > 50 ? '...' : ''),
//     directFromStorage: typeof window !== 'undefined' ? 
//       (localStorage.getItem('custom-instructions') === customInstructions) : false,
//     isDefault: customInstructions === defaultCustomInstructions,
//     model: selectedChatModel
//   });
//   
//   return `${cortex}\n\n${customInstructions}`;
// };

// Remove event listeners related to the old 'custom-instructions' key
// if (typeof window !== 'undefined') {
//   window.addEventListener('custom-instructions-updated', ((e: CustomEvent) => {
//     if (e.detail && e.detail.instructions) {
//       const oldValue = latestCustomInstructions;
//       latestCustomInstructions = e.detail.instructions;
//       console.log('[DEBUG event] Updated instructions in memory via custom event:', {
//         before: oldValue.substring(0, 30) + '...',
//         after: latestCustomInstructions.substring(0, 30) + '...',
//         changed: oldValue !== latestCustomInstructions
//       });
//     }
//   }) as EventListener);
//   
//   // Also listen for storage events from other tabs
//   window.addEventListener('storage', (e) => {
//     if (e.key === 'custom-instructions' && e.newValue) {
//       const oldValue = latestCustomInstructions;
//       latestCustomInstructions = e.newValue;
//       console.log('[DEBUG storage] Updated instructions in memory via storage event:', {
//         before: oldValue.substring(0, 30) + '...',
//         after: latestCustomInstructions.substring(0, 30) + '...',
//         changed: oldValue !== latestCustomInstructions
//       });
//     }
//   });
// }

// Remove backward compatibility export for unused variable
// export const customInstructions = defaultCustomInstructions;

// Ensure createSystemPrompt uses the personality-aware getCustomInstructions
export function createSystemPrompt(customInstructions: string): string {
  return `You are a helpful AI assistant. Follow the user's requirements carefully and to the letter.
${customInstructions ? `\n\n# User's Custom Instructions:\n${customInstructions}` : ''}`;
}

// Helper function to build the final prompt messages
export function buildFinalPrompt(messages: Message[]): Message[] {
  const customInstructions = getCustomInstructions();
  const systemPrompt = createSystemPrompt(customInstructions);

  // Ensure the first message is the system prompt
  if (messages.length > 0 && messages[0].role === 'system') {
    // Update existing system prompt if necessary (though typically static after creation)
    messages[0].content = systemPrompt;
  } else {
    // Prepend system prompt if it doesn't exist
    messages.unshift({ id: 'system-prompt', role: 'system', content: systemPrompt });
  }

  console.log('[Prompts] Built final prompt with system message:', messages[0]);
  return messages;
}