// hooks/useChat.ts
"use client";

import { generateUniqueId } from "@/utils/uniqueId";
import { useCallback, useState, useEffect } from "react";
import { flushSync } from 'react-dom';
import { startTransition } from "react";
import { cortex } from '@/lib/ai/cortex';
import { useRouter } from "next/navigation";
import { useChatStore } from "./useChatStore";
import { Message, ChatHistory } from "@/types/chat";
import { useFileUpload } from "./useFIleUpload";
import { useChatContext } from "@/context/ChatContext";
import { performWebSearch } from '@/lib/ai/cortex.server';
import { createClient } from "@/utils/supabase/client";
import {
  createNewChatSessionAction,
  sendMessageAction,
  fetchChatHistoriesAction,
  editChatSessionAction,
  deleteChatSessionAction,
} from "@/src/app/chat/actions";
interface UseChatProps {
  sessionId?: string;
}

export const useChat = ({ sessionId: initialSessionId }: UseChatProps) => {
  const chatCortex = cortex();

  const router = useRouter();
  const supabase = createClient();

  // --- State from useChatSession ---
  const [userId, setUserId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    initialSessionId || null
  );
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);

  // --- State from useChat ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  // --- Context from useChatContext ---
  const {
    model,
    setModel,
    isModelLocked,
    setIsModelLocked,
    isInitialized,
    setIsInitialized,
    isDrawerOpen,
  } = useChatContext();

  // --- Store from useChatStore ---
  const { messages, setMessages } = useChatStore();

  // --- File Upload from useFileUpload ---
  const {
    selectedFiles,
    handleFilesSelected,
    handleRemoveFile,
    processAndUploadFiles,
    setSelectedFiles,
  } = useFileUpload(userId);

  // --- Auth Handling (Moved from useChatSession) ---
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error) setUserId(data.user?.id || null);
    };
    getUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id || null);
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  // --- Fetch Chat Histories (Moved and Modified from useChatSession & useChat) ---
  const fetchChatHistories = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchChatHistoriesAction(userId);
      setChatHistories(data.histories || []);
    } catch (error) {
      console.error("Error fetching chat histories:", error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchChatHistories();
    }
  }, [userId, fetchChatHistories]);

  // --- Fetch Chat History for a Session (Moved and Modified from useChat) ---
  const fetchChatHistory = useCallback(
    async (sessionIdToFetch: string) => {
      if (!userId) return;
      try {
        const response = await fetch(`/api/chat?sessionId=${sessionIdToFetch}`);
        const data = await response.json();

        if (data.error) {
          console.error("Error fetching chat history:", data.error);
          return null;
        }
        return data;
      } catch (error) {
        console.error("Error fetching chat history:", error);
        return null;
      }
    },
    [userId]
  );

  // --- loadChatFromHistory (Modified & Combined from useChat & useChatSession actions) ---
  const loadChatFromHistory = useCallback(
    async (id: string) => {
      const historyData = await fetchChatHistory(id);
      if (historyData) {
        setMessages(historyData.messages);
        setCurrentSessionId(id); 
        router.push(`/chat/${id}`); 
      } else {
        setMessages([]); // Clear messages if history fetch fails or is empty
      }
    },
    [fetchChatHistory, setMessages, router, setCurrentSessionId]
  );

  useEffect(() => {
    if (initialSessionId && userId) {
      loadChatFromHistory(initialSessionId);
    }
  }, [initialSessionId, userId, loadChatFromHistory]);

  const createErrorMessage = useCallback(
    (): Message => ({
      id: generateUniqueId(),
      content: [
        { type: "text", text: "Error sending message. Please try again." },
      ],
      role: "system",
      displayedContent: "Error sending message. Please try again.",
      createdAt: Date.now(),
    }),
    []
  );

  // --- handleSendMessage (Refined Server Action integration with logging) ---
  const handleSendMessage = useCallback(() => {
    // Preserve the raw input before clearing
    const originalInput = inputMessage.trim();
  
    if ((!originalInput && selectedFiles.length === 0) || !userId || !model) {
      console.error("Missing required data:", { inputMessage, userId, model, selectedFiles });
      return;
    }
  
    // Start with the user's message (if web search is triggered, we'll augment it later)
    let messageContent = originalInput;
  
    setIsSubmitting(true);
  
    const optimisticUserMessage: Message = {
      id: generateUniqueId(),
      content: [{ type: "text", text: messageContent }],
      role: "user",
      displayedContent: messageContent,
      pending: false,
      createdAt: Date.now(),
    };
  
    const optimisticLoadingMessage: Message = {
      id: generateUniqueId(),
      content: [{ type: "text", text: "" }],
      role: "assistant",
      displayedContent: "",
      pending: true,
      createdAt: Date.now(),
    };
  
    flushSync(() => {
      setMessages((prev: Message[]) => [
        ...prev,
        optimisticUserMessage,
        optimisticLoadingMessage,
      ]);
    });
  
    flushSync(() => {
      setInputMessage("");
      setIsModelLocked(true);
      setSelectedFiles([]);
    });
  
    startTransition(async () => {
      let sessionId = currentSessionId;
      if (!sessionId) {
        try {
          const sessionResponse = await createNewChatSessionAction(userId);
          if (!sessionResponse) throw new Error("Failed to create new session");
          sessionId = sessionResponse.sessionId;
          setCurrentSessionId(sessionId);
          router.replace(`/chat/${sessionId}`);
        } catch (error) {
          console.error("Error creating new session:", error);
          setIsSubmitting(false);
          setIsModelLocked(false);
          return;
        }
      }
    
      // If web search is activated by the user (by prefixing with "[SEARCH]"), call the web search function.
      if (originalInput.startsWith("[SEARCH]")) {
        // Remove the trigger token and trim
        const rawQuery = originalInput.replace("[SEARCH]", "").trim();
        try {
          const searchResults = await performWebSearch(rawQuery);
          if (searchResults && searchResults.length > 0) {
            const linksText = searchResults
              .map(
                (result) =>
                  `Title: ${result.title}\nSnippet: ${result.snippet}\nURL: ${result.url}`
              )
              .join("\n\n");
            // Append the web search results to the message content.
            messageContent = `${rawQuery}\n\nWeb Search Results:\n${linksText}`;
          }
        } catch (error) {
          console.error("Error performing web search:", error);
        }
      }
  
      try {
        // Pass systemPrompt along with the (possibly augmented) messageContent
        const aiResponse = await sendMessageAction({
          content: messageContent,
          sessionId,
          userId,
          model,
        });
        const aiMessage = aiResponse.message;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.pending
              ? {
                  ...aiMessage,
                  id: aiMessage.id,
                  displayedContent: aiMessage.content[0].type,
                  pending: false,
                  createdAt: Date.now(),
                }
              : msg
          )
        );
      } catch (messageError) {
        console.error("Error sending message:", messageError);
        setMessages((prev) => [
          ...prev.filter((msg) => !msg.pending),
          { ...createErrorMessage(), pending: false, createdAt: Date.now() },
        ]);
      } finally {
        setIsSubmitting(false);
        setIsModelLocked(false);
      }
    });
  }, [
    inputMessage,
    selectedFiles,
    userId,
    model,
    currentSessionId,
    router,
    setMessages,
    setInputMessage,
    setIsSubmitting,
    setIsModelLocked,
    setCurrentSessionId,
    setSelectedFiles,
  ]);
  
      

  // --- handleNewChat (Modified & Combined from useChat & useChatSession actions) ---
  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
    setSelectedFiles([]);
    router.push("/chat");
    setModel("gemini");
    setIsModelLocked(false);
    setIsInitialized(false);
    setIsSubmitting(false);
  }, [
    setMessages,
    router,
    setCurrentSessionId,
    setModel,
    setIsModelLocked,
    setIsInitialized,
    setIsSubmitting,
    setSelectedFiles,
  ]);

  // --- Session Edit/Delete Handlers ---
  const handleEditChat = useCallback(
    async (id: string, newTitle: string) => {
      if (!userId) return;
      try {
        const { chatHistory } = await editChatSessionAction({
          sessionId: id,
          userId,
          newTitle,
        });
        // Optionally update the chatHistories state with the new title from the response
        setChatHistories((prev) =>
          prev.map((chat) =>
            chat.id === id ? { ...chat, title: chatHistory.title } : chat
          )
        );
      } catch (error) {
        console.error("Error updating chat title:", error);
      }
    },
    [userId, setChatHistories]
  );

  const handleDeleteChat = useCallback(
    async (id: string) => {
      if (!userId) return;
      try {
        const { success } = await deleteChatSessionAction({
          sessionId: id,
          userId,
        });
        if (success) {
          setMessages([]);
          setCurrentSessionId(null);
          router.push("/chat");
          setChatHistories((prev) => prev.filter((chat) => chat.id !== id));
        } else {
          console.error(
            "Error deleting chat session: action did not return success."
          );
        }
      } catch (error) {
        console.error("Error deleting chat session:", error);
      }
    },
    [userId, router, setChatHistories, setMessages, setCurrentSessionId]
  );

  return {
    // --- States ---
    messages,
    inputMessage,
    setInputMessage,
    isSubmitting,
    selectedFiles,
    isInitialized,
    currentSessionId,
    model,
    isModelLocked,
    chatHistories,
    userId,

    // --- Actions ---
    handleFilesSelected,
    handleRemoveFile,
    handleSendMessage,
    handleNewChat,
    loadChatFromHistory,
    fetchChatHistories,
    handleEditChat,
    handleDeleteChat,
    setCurrentSessionId,
  };
};
