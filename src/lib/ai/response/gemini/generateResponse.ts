"use server";

import { Message, MessageContent } from "@/src/types/chat";
import crypto from "crypto";
import axios from "axios";
import { GoogleGenerativeAI, Part, Content } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { cleanAIResponse } from "@/src/lib/utils";

// We'll use the Part and Content types directly from the SDK instead of custom interfaces
async function getImageDataUrl(imageUrl: string): Promise<string> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
    });
    const contentType = response.headers["content-type"];
    const base64Image = Buffer.from(response.data, "binary").toString("base64");
    return `data:${contentType};base64,${base64Image}`;
  } catch (error) {
    console.error("Error fetching image:", error.message);
    throw new Error("Failed to fetch and convert image to base64.");
  }
}

async function fetchFileData(url: string): Promise<Buffer> {
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Error fetching file:", error.message);
    throw new Error("Failed to fetch file data.");
  }
}

// Initialize the API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Initialize the file manager
let fileManager: GoogleAIFileManager | null = null;
if (apiKey) {
  fileManager = new GoogleAIFileManager(apiKey);
}

// Updated to accept context parameter
export async function generateResponse(
  messages: Message[],
  systemPrompt: string,
  context?: any[],
  files?: any[]
): Promise<Message> {
  // Initialize the GoogleGenerativeAI client
  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log("[Gemini] Starting response generation with context:", {
      messagesCount: messages.length,
      hasContext: !!context,
      contextItems: context ? context.length : 0,
      contextTypes: context ? context.map(item => item.type || 'unknown').join(', ') : 'none',
      hasFiles: !!files && files.length > 0,
      filesCount: files ? files.length : 0
    });

    if (context && context.length > 0) {
      // Log the first context item for debugging
      const contextSample = context[0];
      console.log("[Gemini] Context sample:", JSON.stringify(contextSample, null, 2));
      
      // Check for web search results specifically
      const webSearchResults = context.filter(item => item.type === 'web_search_result');
      if (webSearchResults.length > 0) {
        console.log("[Gemini] Found web search results in context:", webSearchResults.length);
        console.log("[Gemini] Web search sample:", JSON.stringify(webSearchResults[0], null, 2));
      }
    }

    // Prepare the user messages for the API request
    const userMessages: Content[] = await Promise.all(
      messages.map(async (msg: Message) => {
        const parts: Part[] = await Promise.all(
          msg.content.map(async (item) => {
            if (item.type === "image_url") {
              // For images embedded in conversations (not file attachments)
              if (!fileManager) {
                // Fallback to data URL if file manager isn't available
                const dataUrl = await getImageDataUrl(item.image_url.url);
                return { text: `Image: ${dataUrl}` } as Part;
              }

              try {
                // Fetch image data
                const imageData = await fetchFileData(item.image_url.url);
                const mimeType =
                  (await axios.head(item.image_url.url)).headers[
                    "content-type"
                  ] || "image/jpeg";

                // Upload to Gemini File API
                const uploadResult = await fileManager.uploadFile(imageData, {
                  mimeType: mimeType,
                  displayName: "Image Attachment",
                });

                // Return fileData instead of text
                return {
                  fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: mimeType,
                  },
                } as Part;
              } catch (error) {
                console.error("Error uploading image to Gemini:", error);
                // Fallback to data URL
                const dataUrl = await getImageDataUrl(item.image_url.url);
                return { text: `Image: ${dataUrl}` } as Part;
              }
            } else if (item.type === "file_url") {
              // Handle file_url type for documents
              if (!fileManager) {
                // Fallback to old method if file manager isn't available
                const fileType = item.mime_type || "application/octet-stream";
                const fileName = item.file_name || "file";
                return {
                  text: `File (${fileType}): ${item.file_url.url} - ${fileName}`,
                } as Part;
              }

              try {
                // Fetch file data
                const fileData = await fetchFileData(item.file_url.url);
                const mimeType = item.mime_type || "application/octet-stream";

                // Upload to Gemini File API
                const uploadResult = await fileManager.uploadFile(fileData, {
                  mimeType: mimeType,
                  displayName: item.file_name || "File Attachment",
                });

                // Return fileData instead of text
                return {
                  fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: mimeType,
                  },
                } as Part;
              } catch (error) {
                console.error("Error uploading file to Gemini:", error);
                // Fallback to old method
                const fileType = item.mime_type || "application/octet-stream";
                const fileName = item.file_name || "file";
                return {
                  text: `File (${fileType}): ${item.file_url.url} - ${fileName}`,
                } as Part;
              }
            } else if (item.type === "text") {
              return { text: item.text } as Part;
            }
            throw new Error(
              `Unsupported content type: ${(item as any).type || "unknown"}`
            );
          })
        );
        return {
          role: msg.role === "assistant" ? "model" : "user",
          parts,
        } as Content;
      })
    );

    // Create the system message
    let systemMessage: Content = {
      role: "user",
      parts: [{ text: systemPrompt }]
    };

    // Format web search results if they exist in the context
    let webSearchPrompt = "";
    let timeAndDatePrompt = "";
    
    if (context) {
      // Handle TimeAndDate context first
      const timeAndDateContext = context.find(item => item && item.TimeAndDate);
      if (timeAndDateContext && timeAndDateContext.TimeAndDate) {
        const td = timeAndDateContext.TimeAndDate;
        timeAndDatePrompt = "\n\n### Current Time and Date ###\n";
        timeAndDatePrompt += `Current Date: ${td.date}\n`;
        timeAndDatePrompt += `Current Time: ${td.time}\n`;
        timeAndDatePrompt += `Current Year: ${td.year}\n`;
        
        console.log("[Gemini] Added TimeAndDate information to prompt");
      }
      
      // Handle web search results
      const webSearchResults = context.filter(item => item && item.type === 'web_search_result');
      if (webSearchResults.length > 0) {
        console.log(`[Gemini] Processing ${webSearchResults.length} web search results for prompt`);
        console.log("[Gemini] First search result:", JSON.stringify(webSearchResults[0], null, 2));
        
        webSearchPrompt = "\n\n### Search Results ###\n\n";
        webSearchResults.forEach((result, index) => {
          // Make sure all fields exist
          const title = result.title || "Search Result";
          const snippet = result.snippet || "No description available";
          const url = result.url || "No source URL";
          const sourceTitle = result.sourceTitle || title || "Search Result";
          
          webSearchPrompt += `[${index + 1}] "${title}"\n${snippet}\nSource: ${sourceTitle} (${url})\n\n`;
        });
        
        console.log("[Gemini] Web search prompt length:", webSearchPrompt.length);
        console.log("[Gemini] Web search prompt sample:", webSearchPrompt.substring(0, 200) + "...");
      }
    }
    
    // Add time and date to system prompt if available
    if (timeAndDatePrompt) {
      systemMessage.parts[0].text += timeAndDatePrompt;
    }
    
    // Add web search results to system prompt if available
    if (webSearchPrompt) {
      systemMessage.parts[0].text += webSearchPrompt;
      
      // Add instruction to use search results
      systemMessage.parts[0].text += "\n\nPlease use the above search results to help answer the user's question. Do not use numbered citations in your response. Instead, add sources in a separate 'Sources' section at the end using this format: 'Sources: [SourceTitle](URL)' with each source on its own line.";
      
      console.log("[Gemini] Added web search results to prompt");
    }

    // Start with the system message
    const allMessages: Content[] = [systemMessage];

    // Add user messages
    for (const msg of userMessages) {
      allMessages.push(msg);
    }

    // Handle file attachments if available
    if (files && files.length > 0) {
      const lastUserMessageIndex = userMessages.findIndex(
        (msg) => msg.role === "user"
      );

      if (lastUserMessageIndex !== -1 && files.length > 0) {
        await Promise.all(
          files.map(async (file) => {
            // Handle FileAttachment structure
            if (file.isImage && fileManager) {
              try {
                // Use file.url instead of file.image_url.url
                const imageData = await fetchFileData(file.url);
                const mimeType = file.mime_type || "image/jpeg";

                const uploadResult = await fileManager.uploadFile(imageData, {
                  mimeType: mimeType,
                  displayName: file.name || "Image Attachment",
                });

                allMessages[lastUserMessageIndex + 1].parts.push({
                  fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: mimeType,
                  },
                } as Part);
              } catch (error) {
                console.error("Error uploading image to Gemini:", error);
                const dataUrl = await getImageDataUrl(file.url);
                allMessages[lastUserMessageIndex + 1].parts.push({
                  text: `Image: ${dataUrl}`,
                } as Part);
              }
            } else if (!file.isImage && fileManager) {
              try {
                // Use file.url instead of file.file_url.url
                const fileData = await fetchFileData(file.url);
                const mimeType = file.mime_type || "application/octet-stream";

                const uploadResult = await fileManager.uploadFile(fileData, {
                  mimeType: mimeType,
                  displayName: file.name || "File Attachment",
                });

                allMessages[lastUserMessageIndex + 1].parts.push({
                  fileData: {
                    fileUri: uploadResult.file.uri,
                    mimeType: mimeType,
                  },
                } as Part);
              } catch (error) {
                console.error("Error uploading file to Gemini:", error);
                // Fall back to text-based approach
                if (
                  file.mime_type.includes("text") ||
                  file.mime_type.includes("json")
                ) {
                  try {
                    const response = await axios.get(file.url);
                    allMessages[lastUserMessageIndex + 1].parts.push({
                      text: `${file.name} (${file.mime_type}):\n${response.data}`,
                    } as Part);
                  } catch (error) {
                    console.error(`Error fetching file: ${file.name}`, error);
                    allMessages[lastUserMessageIndex + 1].parts.push({
                      text: `Unable to retrieve file: ${file.name}`,
                    } as Part);
                  }
                } else {
                  allMessages[lastUserMessageIndex + 1].parts.push({
                    text: `File (${file.mime_type}): ${file.url} - ${file.name}`,
                  } as Part);
                }
              }
            } else if (file.isImage && !fileManager) {
              // Fallback for images when file manager is not available
              const dataUrl = await getImageDataUrl(file.url);
              allMessages[lastUserMessageIndex + 1].parts.push({
                text: `Image: ${dataUrl}`,
              } as Part);
            } else if (!file.isImage && !fileManager) {
              // Fallback for files when file manager is not available
              if (
                file.mime_type.includes("text") ||
                file.mime_type.includes("json")
              ) {
                try {
                  const response = await axios.get(file.url);
                  allMessages[lastUserMessageIndex + 1].parts.push({
                    text: `${file.name} (${file.mime_type}):\n${response.data}`,
                  } as Part);
                } catch (error) {
                  console.error(`Error fetching file: ${file.name}`, error);
                  allMessages[lastUserMessageIndex + 1].parts.push({
                    text: `Unable to retrieve file: ${file.name}`,
                  } as Part);
                }
              } else {
                allMessages[lastUserMessageIndex + 1].parts.push({
                  text: `File (${file.mime_type}): ${file.url} - ${file.name}`,
                } as Part);
              }
            }
          })
        );
      }
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-001",
      systemInstruction: {
        parts: [{ text: systemPrompt }],
        role: "model",
      },
    });

    // Define generation configuration for the model
    const generationConfig = {
      // temperature: 0.7,
      // topP: 0.95,
      // topK: 64,
      // maxOutputTokens: 1024,
    };

    // Use the GoogleGenerativeAI client to generate content
    const result = await model.generateContent({
      contents: allMessages,
      generationConfig,
    });

    // Add better error handling with detailed logging
    if (!result) {
      console.error("Result is undefined");
      throw new Error("Empty response from Gemini API");
    }

    if (!result.response) {
      console.error("Response is undefined", result);
      throw new Error("Response object missing from Gemini API result");
    }

    if (!result.response.candidates || !result.response.candidates.length) {
      console.error("Candidates array is empty or undefined", result.response);
      throw new Error("No candidates returned from Gemini API");
    }

    const candidate = result.response.candidates[0];
    if (!candidate.content) {
      console.error("Content is undefined in first candidate", candidate);
      throw new Error("Content missing from Gemini API response candidate");
    }

    if (!candidate.content.parts || !candidate.content.parts.length) {
      console.error("Parts array is empty or undefined", candidate.content);
      throw new Error("No content parts in Gemini API response");
    }

    const firstPart = candidate.content.parts[0];
    if (!firstPart.text) {
      console.error(
        "Text property is missing from first content part",
        firstPart
      );
      throw new Error("Text missing from Gemini API response part");
    }

    // Now safely extract the assistant content
    const assistantContent = firstPart.text;

    // Format the response as MessageContent for your app
    const contentArray: MessageContent[] = [
      { type: "text", text: assistantContent },
    ];

    const cleanedContent = cleanAIResponse(assistantContent);
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: [{ type: "text", text: cleanedContent }],
      displayedContent: cleanedContent,
      createdAt: Date.now(),
    };
  } catch (error: any) {
    console.error("Error generating Gemini response:", error.message);
    console.error("Error stack:", error.stack);
    throw new Error("Failed to generate response using Gemini.");
  }
}
