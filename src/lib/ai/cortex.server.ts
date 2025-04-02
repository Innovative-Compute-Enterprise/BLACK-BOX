"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message } from "@/src/types/chat"; // Adjust path if necessary
import { LRUCache } from "lru-cache";

// --- Configuration ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SERPAPI_API_KEY = process.env.SERPAPI_API_KEY;
const SAFE_SEARCH_SETTING: "active" | "off" = "active"; // Or 'off'

// --- Constants ---
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const DEEP_SEARCH_CACHE_DURATION = 20 * 60 * 1000; // 20 minutes
const LOCATION_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const MAX_SECONDARY_SEARCHES = 2;
const MAX_TOTAL_RESULTS = 6;
const API_TIMEOUT = 7000; // 7 seconds

// --- Caching ---
const searchCache = new LRUCache<
  string,
  { results: ResultItem[]; timestamp: number }
>({ max: 200, ttl: CACHE_DURATION });
const deepSearchCache = new LRUCache<
  string,
  { results: ResultItem[]; timestamp: number }
>({ max: 100, ttl: DEEP_SEARCH_CACHE_DURATION });
const locationCache = new LRUCache<
  string,
  { location: string | null; timestamp: number }
>({ max: 500, ttl: LOCATION_CACHE_DURATION });

// --- Result Type ---
interface ResultItem {
  title: string;
  snippet: string;
  url: string;
  sourceTitle?: string;
  isDirectAnswer?: boolean;
  // Structured Data Fields
  price?: string;
  change?: string;
  currency?: string;
  stockTicker?: string;
  score?: string;
  matchStatus?: string;
  team1Name?: string;
  team1Score?: string;
  team2Name?: string;
  team2Score?: string;
  locationName?: string;
  temperature?: string;
  condition?: string;
  precipitation?: string;
  humidity?: string;
  wind?: string;
}

// --- Debug Logging ---
const debugLog = (message: string, data: object = {}) => {
  console.log(`DEBUG: ${message}`, JSON.stringify(data, null, 2));
};

// --- API Key Checks & Gemini Setup ---
(() => {
  if (!GEMINI_API_KEY) console.error("ERROR: GEMINI_API_KEY is not set!");
  if (!SERPAPI_API_KEY) console.error("ERROR: SERPAPI_API_KEY is not set!");
})();
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// ==============================================
// TOP-LEVEL HELPER FUNCTIONS
// ==============================================

/** Cleans URL, removing tracking params. */
const cleanUrl = (url: string | undefined): string => {
  if (!url) return "";
  try {
    const parsedUrl = new URL(url);
    const paramsToRemove = [
      "utm_",
      "ref",
      "sa=",
      "ved=",
      "usg=",
      "ei=",
      "fbclid=",
      "gclid=",
      "_ga",
      "msclkid",
    ];
    const cleanParams = new URLSearchParams();
    parsedUrl.searchParams.forEach((value, key) => {
      if (!paramsToRemove.some((prefix) => key.startsWith(prefix))) {
        cleanParams.append(key, value);
      }
    });
    let cleanUrlStr = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`;
    const cleanParamsString = cleanParams.toString();
    if (cleanParamsString) {
      cleanUrlStr += `?${cleanParamsString}`;
    }
    if (cleanUrlStr.endsWith("/") && parsedUrl.pathname !== "/") {
      cleanUrlStr = cleanUrlStr.slice(0, -1);
    }
    return cleanUrlStr;
  } catch (e) {
    return url || "";
  }
};

/** Creates a concise source title from URL/title. */
const createSourceTitle = (title: string | undefined, url: string): string => {
  let sourceTitle = title || "Source";
  if (!url) return sourceTitle.slice(0, 50);
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.replace(/^www\./, "");
    if (
      !title ||
      title.length > 50 ||
      title.toLowerCase() === "source" ||
      title.toLowerCase() === "website"
    ) {
      sourceTitle =
        host
          .split(".")[0]
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ") || host;
    }
  } catch (e) {}
  return sourceTitle.slice(0, 50);
};

/** Truncates snippet intelligently. */
const truncateSnippet = (
  snippet: string | undefined,
  maxChars: number = 200
): string => {
  if (!snippet) return "No snippet available.";
  if (snippet.length <= maxChars) return snippet;
  let truncated = snippet.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > maxChars / 2) {
    truncated = truncated.substring(0, lastPeriod + 1);
  } else {
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 0) {
      truncated = truncated.substring(0, lastSpace) + "...";
    } else {
      truncated += "...";
    }
  }
  return truncated;
};

// ==============================================
// LOCATION DETECTION
// ==============================================

/** Detects if query implies a specific geographical location. */
async function detectLocation(query: string): Promise<string | null> {
  const cacheKey = `loc_${query.toLowerCase().trim()}`;
  const cached = locationCache.get(cacheKey);
  if (cached) return cached.location;

  const locationKeywords = [
    " in ",
    " near ",
    " weather ",
    " forecast ",
    " temperature ",
    " directions to ",
    " restaurants ",
  ];
  if (!locationKeywords.some((kw) => query.toLowerCase().includes(kw))) {
    locationCache.set(cacheKey, { location: null, timestamp: Date.now() });
    return null;
  }
  if (!genAI) return null; // Cannot detect without LLM

  const prompt = `Does the following user query explicitly ask for information related to a specific geographical location (city, state, country, address, "near me")? If yes, return ONLY the location name (e.g., "London, UK", "Paris", "near me"). If no specific location is mentioned or implied, return ONLY "null".\n\nQuery: "${query}"\n\nLocation (or "null"):`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const result = await model.generateContent(prompt);
    clearTimeout(timeoutId);
    let location = result.response.text().trim();
    if (location.toLowerCase() === "null" || location === "") location = null;
    debugLog("Location detection result", {
      query,
      detectedLocation: location,
    });
    locationCache.set(cacheKey, { location, timestamp: Date.now() });
    return location;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error detecting location:", error.message);
    locationCache.set(cacheKey, { location: null, timestamp: Date.now() }); // Cache null on error
    return null;
  }
}

// ==============================================
// FOLLOW-UP QUERY GENERATION
// ==============================================

/** Generates follow-up search queries based on initial results. */
async function generateFollowUpQueries(
  originalQuery: string,
  initialResults: ResultItem[]
): Promise<string[]> {
  debugLog("Starting generateFollowUpQueries", {
    originalQuery,
    resultsCount: initialResults.length,
  });
  if (!genAI || initialResults.length === 0) return [];
  const resultsSummary = initialResults
    .slice(0, 5)
    .map((r) => `Title: ${r.title}\nSnippet: ${r.snippet}`)
    .join("\n\n");

  const prompt = `You are an AI assistant specialized in search analysis. Based on the initial search results for the query "${originalQuery}", identify up to ${MAX_SECONDARY_SEARCHES} distinct and relevant topics, entities, or questions for follow-up searches to gain a deeper or broader understanding. Focus on queries exploring different facets or related concepts from the snippets. Avoid simple reformulations. Return ONLY a JSON array of strings (concise search queries).\n\nInitial Query: "${originalQuery}"\nSearch Results Summary:\n---\n${resultsSummary}\n---\nFollow-up Search Queries (JSON Array):`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const result = await model.generateContent(prompt);
    clearTimeout(timeoutId);
    const responseText = result.response.text().trim();
    let followUpQueries: string[] = [];
    try {
      const jsonMatch = responseText.match(/\[\s*(".*?"\s*,?\s*)*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (
          Array.isArray(parsed) &&
          parsed.every((item) => typeof item === "string")
        ) {
          followUpQueries = parsed
            .map((q) => q.trim())
            .filter(
              (q) =>
                q.length > 0 && q.toLowerCase() !== originalQuery.toLowerCase()
            )
            .slice(0, MAX_SECONDARY_SEARCHES);
        }
      }
    } catch (parseError) {
      debugLog("Failed to parse follow-up JSON", { responseText });
    }
    // Basic fallback parsing if JSON fails
    if (followUpQueries.length === 0 && responseText.includes('"')) {
      followUpQueries = responseText
        .split("\n")
        .map((q) => q.replace(/^- /, "").trim())
        .filter(
          (q) => q.length > 3 && q.toLowerCase() !== originalQuery.toLowerCase()
        )
        .slice(0, MAX_SECONDARY_SEARCHES);
    }
    debugLog("Generated follow-up queries", { followUpQueries });
    return followUpQueries;
  } catch (apiError) {
    clearTimeout(timeoutId);
    console.error("Error generating follow-up queries:", apiError.message);
    return [];
  }
}

// ==============================================
// DEEP SEARCH ORCHESTRATOR
// ==============================================

/** Performs a multi-step search, including location detection and follow-up queries. */
export async function performDeepSearch(
  query: string,
  messages: Message[]
): Promise<ResultItem[]> {
  debugLog("Starting performDeepSearch", { query });
  if (!query || query.trim() === "") return [];
  if (!SERPAPI_API_KEY) {
    console.error("ERROR: SERPAPI_API_KEY missing!");
    return [];
  }

  const detectedLocation = await detectLocation(query);
  debugLog("Location detection completed", { detectedLocation });

  const deepCacheKey = `deep_${detectedLocation || "none"}_${query
    .toLowerCase()
    .trim()}`;
  const cached = deepSearchCache.get(deepCacheKey);
  if (cached) {
    debugLog("Returning cached deep search results", {
      key: deepCacheKey,
      count: cached.results.length,
    });
    return cached.results;
  }

  let finalResultsAccumulator: ResultItem[] = [];
  let initialResults: ResultItem[] = [];

  try {
    // Initial search with location
    initialResults = await performWebSearch(query, messages, detectedLocation);
    debugLog("Initial search completed", { count: initialResults.length });
    if (!initialResults || initialResults.length === 0) {
      deepSearchCache.set(deepCacheKey, { results: [], timestamp: Date.now() });
      return [];
    }
    finalResultsAccumulator = [...initialResults];

    // Follow-up searches with location
    let followUpQueries: string[] = [];
    if (genAI && initialResults.length > 0) {
      followUpQueries = await generateFollowUpQueries(query, initialResults);
    }
    if (followUpQueries.length > 0) {
      const secondarySearchPromises = followUpQueries.map((fq) =>
        performWebSearch(fq, [], detectedLocation)
      ); // Pass location
      const secondaryResultsSettled = await Promise.allSettled(
        secondarySearchPromises
      );
      secondaryResultsSettled.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          finalResultsAccumulator = finalResultsAccumulator.concat(
            result.value.slice(0, 2)
          ); // Add top 2 from secondary
        } else if (result.status === "rejected") {
          console.error(`Secondary search failed:`, result.reason);
        }
      });
      debugLog("Added secondary results", {
        count: finalResultsAccumulator.length - initialResults.length,
      });
    }

    // Combine, Deduplicate
    const uniqueResultsMap = new Map<string, ResultItem>();
    for (const result of finalResultsAccumulator) {
      const urlToUseForKey = cleanUrl(result.url);
      const key = urlToUseForKey || `no_url_${result.title}_${Math.random()}`;
      if (!uniqueResultsMap.has(key)) {
        result.url = urlToUseForKey; // Ensure cleaned URL is stored
        uniqueResultsMap.set(key, result);
      }
    }
    let combinedUniqueResults = Array.from(uniqueResultsMap.values());

    // Final Ranking (Prioritize direct answers & structured data)
    combinedUniqueResults.sort((a, b) => {
      let scoreA = a.isDirectAnswer ? 100 : 0;
      let scoreB = b.isDirectAnswer ? 100 : 0;
      if (a.price || a.score || a.temperature) scoreA += 50; // Boost structured
      if (b.price || b.score || b.temperature) scoreB += 50;
      if (initialResults.some((ir) => ir.url === a.url)) scoreA += 20; // Boost initial
      if (initialResults.some((ir) => ir.url === b.url)) scoreB += 20;
      return scoreB - scoreA;
    });

    // Limit & Cache
    const limitedResults = combinedUniqueResults.slice(0, MAX_TOTAL_RESULTS);
    debugLog("DeepSearch finished", {
      query,
      finalCount: limitedResults.length,
    });
    deepSearchCache.set(deepCacheKey, {
      results: limitedResults,
      timestamp: Date.now(),
    });
    return limitedResults;
  } catch (error) {
    console.error("Error during performDeepSearch orchestrator:", error);
    // Fallback logic
    const fallbackResults =
      finalResultsAccumulator.length > 0
        ? finalResultsAccumulator
        : await performWebSearch(query, messages, detectedLocation).catch(
            () => []
          );
    const limitedFallback = fallbackResults.slice(0, MAX_TOTAL_RESULTS);
    deepSearchCache.set(deepCacheKey, {
      results: limitedFallback,
      timestamp: Date.now(),
    }); // Cache fallback briefly
    return limitedFallback;
  }
}

// ==============================================
// WEB SEARCH (CORE - with Structured Data etc.) - CORRECTED
// ==============================================

/** Performs a single web search using SerpApi, extracting structured data. */
export async function performWebSearch(
  query: string,
  messages: Message[],
  location: string | null = null,
  timePeriod: 'day' | 'week' | 'month' | null = null
): Promise<ResultItem[]> {
  const isInitialCall = messages.length > 0;
  debugLog("Starting performWebSearch", { query, isInitialCall, location, timePeriod });
  if (!query || query.trim() === '') return [];
  if (!SERPAPI_API_KEY) throw new Error("SERPAPI_API_KEY not set");

  // Use refinedQuery consistently after this point
  const refinedQuery = isInitialCall ? await createSearchQuery(query, messages, timePeriod) : query;
  if (!refinedQuery) return [];

  const cacheKey = `web_${location || 'none'}_${timePeriod || 'none'}_${refinedQuery}`;
  const cached = searchCache.get(cacheKey);
  if (cached) {
      debugLog("Returning cached web search results", { key: cacheKey, count: cached.results.length });
      return cached.results;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
      const numResults = isInitialCall ? 7 : 5;
      const endpoint = "https://serpapi.com/search";
      let url = `${endpoint}?q=${encodeURI(refinedQuery)}&api_key=${SERPAPI_API_KEY}&num=${numResults}&google_domain=google.com&gl=us&hl=en`;
      if (location) url += `&location=${encodeURI(location)}`;
      url += `&safe=${SAFE_SEARCH_SETTING}`;
      let tbsValue: string | null = null;
      if (timePeriod === 'day') tbsValue = 'qdr:d'; else if (timePeriod === 'week') tbsValue = 'qdr:w'; else if (timePeriod === 'month') tbsValue = 'qdr:m';
      if (tbsValue && !refinedQuery.includes('tbs=')) url += `&tbs=${tbsValue}`;

      debugLog("Making SerpAPI request", { url: url.replace(SERPAPI_API_KEY, '***') });
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) { const errBody = await res.text(); throw new Error(`SerpAPI ${res.status}: ${errBody.slice(0,200)}`); }
      const data = await res.json();

      // --- Structured Data Extraction ---
      let results: ResultItem[] = [];
      let processedUrls = new Set<string>();
      const addUniqueResult = (result: ResultItem) => {
          const cleanedResultUrl = cleanUrl(result.url) || `no_url_${result.title}_${Math.random()}`;
          result.url = cleanedResultUrl;
          if (!processedUrls.has(result.url)) { results.push(result); processedUrls.add(result.url); return true; } return false;
      };

      // Priority 0: Weather
      if (data.weather_results) {
          const wr = data.weather_results; const url = cleanUrl(wr.link);
          // *** CORRECTED FALLBACK URL ***
          addUniqueResult({ title: `Weather in ${wr.location || location || 'current location'}`, snippet: `Currently ${wr.temperature}°${wr.unit || 'F'}, ${wr.condition}. ${wr.precipitation || ''} precipitation, ${wr.humidity || ''} humidity, ${wr.wind || ''} wind.`, url: url || `https://www.google.com/search?q=${encodeURI(refinedQuery)}`, sourceTitle: createSourceTitle("Google Weather", url), isDirectAnswer: true, locationName: wr.location, temperature: `${wr.temperature}°${wr.unit || 'F'}`, condition: wr.condition, precipitation: wr.precipitation, humidity: wr.humidity, wind: wr.wind });
      }
      // Priority 1: Sports
      if (data.sports_results?.[0]?.teams?.length >= 2) {
          const game = data.sports_results[0]; const team1 = game.teams[0]; const team2 = game.teams[1]; const score = team1.score && team2.score ? `${team1.score}-${team2.score}` : undefined; const url = cleanUrl(game.link);
          // *** CORRECTED FALLBACK URL ***
          addUniqueResult({ title: game.title || `${team1.name} vs ${team2.name}`, snippet: `${game.game_spotlight || game.tournament || ''} ${score ? `Score: ${score}`: ''} (${game.status || 'Status unknown'})`.trim(), url: url || `https://www.google.com/search?q=${encodeURI(refinedQuery)}`, sourceTitle: createSourceTitle(game.title, url), isDirectAnswer: true, score: score, matchStatus: game.status, team1Name: team1.name, team1Score: team1.score, team2Name: team2.name, team2Score: team2.score });
      }
      // Priority 2: Finance
      const financeSource = data.answer_box?.type?.toLowerCase().includes('finance') ? data.answer_box : data.knowledge_graph;
      if (financeSource && (financeSource.price || financeSource.stock || financeSource.title?.toLowerCase().includes('stock'))) {
          const fs = financeSource; const price = fs.price; const change = fs.change || fs.price_change; const currency = fs.currency; const stock = fs.stock || fs.title?.match(/\((.*?)\)/)?.[1]; const snippetText = fs.answer || fs.snippet || fs.description || `Price data for ${stock || query}`; // Use original query for snippet fallback
          if (price) { const url = cleanUrl(fs.link || fs.source?.link || fs.website);
              // *** CORRECTED FALLBACK URL ***
              addUniqueResult({ title: fs.title || `${stock || 'Financial Data'} Price`, snippet: truncateSnippet(snippetText), url: url || `https://www.google.com/search?q=${encodeURI(refinedQuery)}`, sourceTitle: createSourceTitle(fs.source?.name || fs.title, url), isDirectAnswer: true, price: `${currency || '$'}${price}`, change: change, currency: currency, stockTicker: stock });
          }
      }
      // Priority 3: General Answer Box
      if (data.answer_box && !processedUrls.has(cleanUrl(data.answer_box.link))) {
          const ab = data.answer_box; const snippetText = ab.answer || ab.snippet || ab.result;
          if (snippetText) { const url = cleanUrl(ab.link);
               // *** CORRECTED FALLBACK URL ***
               addUniqueResult({ title: ab.title || "Direct Answer", snippet: truncateSnippet(snippetText), url: url || `https://www.google.com/search?q=${encodeURI(refinedQuery)}`, sourceTitle: createSourceTitle(ab.source?.name || ab.title, url), isDirectAnswer: true });
          }
      }
      // Priority 4: General Knowledge Graph
      const kgUrl = cleanUrl(data.knowledge_graph?.source?.link || data.knowledge_graph?.website);
      if (data.knowledge_graph && !processedUrls.has(kgUrl)) {
          const kg = data.knowledge_graph; const snippetText = kg.description || kg.snippet;
          if (snippetText) {
               // *** CORRECTED FALLBACK URL ***
               addUniqueResult({ title: kg.title || kg.name || "Information Card", snippet: truncateSnippet(snippetText), url: kgUrl || `https://www.google.com/search?q=${encodeURI(refinedQuery)}`, sourceTitle: createSourceTitle(kg.source?.name || kg.title, kgUrl), isDirectAnswer: true });
          }
      }
      // Priority 5: Organic Results
      if (data.organic_results) {
          data.organic_results.filter((i: any) => i.link && i.title && i.snippet).forEach((item: any) => { addUniqueResult({ title: item.title, snippet: truncateSnippet(item.snippet), url: item.link, sourceTitle: createSourceTitle(item.displayed_link || item.source, item.link), isDirectAnswer: false }); });
      }
      // Priority 6: Related Questions
      if (data.related_questions) {
          data.related_questions.filter((i: any) => i.question && i.snippet && i.link).slice(0, 2).forEach((item: any) => { addUniqueResult({ title: item.question, snippet: truncateSnippet(item.snippet), url: item.link, sourceTitle: createSourceTitle(item.source?.name, item.link), isDirectAnswer: false }); });
      }

      debugLog("performWebSearch finished", { query: refinedQuery, finalCount: results.length });
      searchCache.set(cacheKey, { results, timestamp: Date.now() });
      return results;

  } catch (error) {
      clearTimeout(timeout); console.error(`Error in performWebSearch for query "${refinedQuery}":`, error);
      return [];
  }
}

// ==============================================
// QUERY REFINEMENT (with Time Period)
// ==============================================

/** Optimizes search query using Gemini, potentially adding time filters. */
export async function createSearchQuery(
  userQuery: string,
  messages: Message[],
  timePeriod: "day" | "week" | "month" | null = null
): Promise<string> {
  debugLog("Starting createSearchQuery", { userQuery, timePeriod });
  if (!genAI || !userQuery || userQuery.trim() === "") return userQuery || "";
  if (messages.length === 0 && !timePeriod) return userQuery;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const chatContext = messages
      .slice(-5)
      .map(
        (m) =>
          `${m.role}: ${m.content
            .map((c) => (c.type === "text" ? c.text : "[Image]"))
            .join(" ")}`
      )
      .join("\n");

    const prompt = `You are an expert search query optimizer. Create the MOST NEUTRAL and EFFECTIVE search query based on the conversation. Guidelines: Focus on the core information need. Use quotes ONLY for exact phrases. Remove filler words. If the user asks for recent/latest news, scores, or results (e.g., "latest", "today", "past week", "last night"), **AND** a specific time period (day, week, month) is suggested, append the corresponding 'tbs' parameter: day: 'tbs=qdr:d', week: 'tbs=qdr:w', month: 'tbs=qdr:m'. If no specific time period is suggested OR the query isn't time-sensitive, DO NOT add 'tbs'. Consider previous messages for follow-up intent.\n\nConversation Context:\n${chatContext}\n\nOriginal Query: "${userQuery}"\nSuggested Time Period: ${
      timePeriod || "None"
    }\n\nOptimized Search Query (ONLY the query itself):`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const result = await model.generateContent(prompt);
    clearTimeout(timeoutId);
    const refinedQuery = result.response.text().trim();
    debugLog("Search query optimization result", {
      originalQuery: userQuery,
      timePeriod,
      refinedQuery,
    });
    return refinedQuery || userQuery;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error generating optimized search query:", error.message);
    return userQuery; // Fallback on error
  }
}

// ==============================================
// CHAT TITLE GENERATION
// ==============================================

/** Generates a concise chat title using Gemini. */
export async function generateChatTitle(messages: Message[]): Promise<string> {
  const defaultTitle = "New Chat";
  if (!genAI || !messages || messages.length === 0) return defaultTitle;
  const validMessages = messages.every(
    (m) => m.role && Array.isArray(m.content)
  );
  if (!validMessages) return defaultTitle;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const chatContext = messages
      .slice(-4)
      .map(
        (m) =>
          `${m.role}: ${m.content
            .map((c) => (c.type === "text" ? c.text : "[Image]"))
            .join(" ")}`
      )
      .join("\n");
    const prompt = `You are an AI assistant that creates concise and obvious titles for chat sessions. Based on the following conversation history, generate a short and relevant title (max 5 words).\n---\n${chatContext}\n---\nTitle:`;
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });
    const result = await model.generateContent(prompt);
    clearTimeout(timeoutId);
    const generatedTitle = result.response
      .text()
      .trim()
      .replace(/^Title:\s*/i, "");
    return generatedTitle || defaultTitle;
  } catch (apiError) {
    clearTimeout(timeoutId);
    console.error("API error generating chat title:", apiError.message);
    return defaultTitle;
  }
}
