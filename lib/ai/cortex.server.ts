"use server";

import { OpenAI } from "openai";
import { Message } from "@/types/chat";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY, 
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

/**
 * This function calls the OpenAI API to generate a chat title.
 */
export async function generateChatTitle(messages: Message[]): Promise<string> {
  const defaultTitle = "New Chat";
  if (!messages || messages.length === 0) return defaultTitle;

  try {
    const chatContext = messages
      .slice(-2)
      .map((message) => {
        const content = message.content
          .map((c) => (c.type === "text" ? c.text : "[Image]"))
          .join(" ");
        return `${message.role}: ${content}`;
      })
      .join("\n");

    const prompt = `
      You are an AI assistant that creates concise and obvious titles for chat sessions.
      Based on the following conversation history, generate a short and relevant title:
      ---
      ${chatContext}
      ---
      Title:
    `;

    const response = await openai.chat.completions.create({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Generate concise chat titles (max 4 words) based on conversation context.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 16,
      temperature: 1,
    });

    const generatedTitle = response.choices[0]?.message?.content?.trim();
    if (!generatedTitle) throw new Error("No title received");
    return generatedTitle;
  } catch (error) {
    console.error("Error generating chat title:", error);
    return defaultTitle;
  }
}

/**
 * Uses the LLM to refine the raw user query into an optimal search query.
 */
export async function createSearchQuery(userQuery: string): Promise<string> {
  try {
    const prompt = `
Given the following user query, generate a concise and precise web search query that returns the most relevant and up‑to‑date results.
User query: "${userQuery}"
Search query:
    `;
    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "system",
          content:
            "Refine the provided user query into an optimal search query for web search. Keep it concise.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 50,
      temperature: 0.7,
    });
    const refinedQuery = response.choices[0]?.message?.content?.trim();
    if (!refinedQuery) throw new Error("No refined query generated");
    return refinedQuery;
  } catch (error) {
    console.error("Error creating refined search query:", error);
    return userQuery; // fallback to the original query if refinement fails
  }
}

/**
 * Performs a real web search using the external Bing Web Search API.
 * It first refines the user query via the LLM, then queries Bing to retrieve current results.
 */
export async function performWebSearch(query: string): Promise<{ title: string; snippet: string; url: string }[]> {
  // Get the refined query from the LLM
  const refinedQuery = await createSearchQuery(query);
  console.log("Performing web search with refined query:", refinedQuery);

  const apiKey = process.env.BING_API_KEY;
  if (!apiKey) {
    throw new Error("BING_API_KEY not set in environment");
  }
  const endpoint = "https://api.bing.microsoft.com/v7.0/search";
  const url = `${endpoint}?q=${encodeURIComponent(refinedQuery)}&count=2`;

  const res = await fetch(url, {
    headers: {
      "Ocp-Apim-Subscription-Key": apiKey,
    },
  });
  if (!res.ok) {
    throw new Error(`Web search API error: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.webPages || !data.webPages.value) return [];
  return data.webPages.value.map((item: any) => ({
    title: item.name,
    snippet: item.snippet,
    url: item.url,
  }));
}
