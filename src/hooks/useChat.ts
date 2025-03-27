"use client";

import { generateUniqueId } from "@/src/utils/uniqueId";
import { useCallback, useState, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  useChatStore, 
  useMessages, 
  useSetMessages,
  useCurrentSessionId,
  useSetCurrentSessionId,
  useIsSubmitting,
  useSetIsSubmitting,
  useSetSelectedFiles,
  useSelectedFiles,
} from "./useChatStore";
import { Message, ChatHistory } from "@/src/types/chat";
import { useFileUpload } from "./useFIleUpload";
import { useChatContext } from "@/src/context/ChatContext";
import { performWebSearch } from "@/src/lib/ai/cortex.server";
import { createClient } from "@/src/utils/supabase/client";
import { useToast } from "@/src/components/ui/Toasts/use-toast";
import { createSuccessToast, createErrorToast } from "@/src/utils/helpers";
import {
  createNewChatSessionAction,
  sendMessageAction,
  fetchChatHistoriesAction,
  editChatSessionAction,
  deleteChatSessionAction,
} from "@/src/app/chat/actions";
import { chatCortex } from "@/src/lib/ai/cortex";
import { getCustomInstructions, defaultCustomInstructions } from "@/src/lib/ai/prompts";

interface UseChatProps {
  sessionId?: string;
}

export const useChat = ({ sessionId: initialSessionId }: UseChatProps) => {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  // --- Use Zustand store selectors for state ---
  const messages = useMessages();
  const setMessages = useSetMessages();
  const currentSessionId = useCurrentSessionId();
  const setCurrentSessionId = useSetCurrentSessionId();
  const isSubmitting = useIsSubmitting();
  const setIsSubmitting = useSetIsSubmitting();
  const selectedFiles = useSelectedFiles();
  const setSelectedFiles = useSetSelectedFiles();

  // --- Search State ---
  const [isWebSearchEnabled, setIsWebSearchEnabled] = useState(false);
  const [autoSearchMode, setAutoSearchMode] = useState(false); 

  // --- Custom Instructions state ---
  const [customInstructions, setCustomInstructions] = useState(() => 
    typeof window !== 'undefined' ? getCustomInstructions() : ''
  );

  // --- Additional state ---
  const [userId, setUserId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);

  

  // --- Context from useChatContext ---
  const {
    model,
    setModel,
    isModelLocked,
    setIsModelLocked,
    isInitialized,
    setIsInitialized,
  } = useChatContext();

  // --- Listen for custom instructions changes ---
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'custom-instructions') {
        console.log('[useChat] Custom instructions updated in localStorage');
        setCustomInstructions(e.newValue || getCustomInstructions());
      }
    };
    
    // Listen for custom event for more immediate updates
    const handleCustomInstructionsUpdate = (e: CustomEvent) => {
      console.log('[useChat] Detected custom instructions update via custom event');
      if (e.detail && e.detail.instructions) {
        setCustomInstructions(e.detail.instructions);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('custom-instructions-updated', handleCustomInstructionsUpdate as EventListener);
    
    // Log the current custom instructions on mount
    console.log('[useChat] Current custom instructions on mount:', 
      customInstructions ? customInstructions.substring(0, 30) + '...' : '(none)');
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('custom-instructions-updated', handleCustomInstructionsUpdate as EventListener);
    };
  }, []);

  // Memoize toggle functions to prevent recreating them on every render
  const toggleWebSearch = useCallback((active: boolean) => {
    console.log(`[useChat] ${active ? 'Enabling' : 'Disabling'} web search`);
    setIsWebSearchEnabled(active);
  }, []);

  const toggleModelLock = useCallback((locked: boolean) => {
    setIsModelLocked(locked);
  }, [setIsModelLocked]);

  // --- File Upload with enhanced OCR capabilities ---
  const {
    selectedFiles: processedFiles,
    handleFilesSelected: processFiles,
    handleRemoveFile: removeProcessedFile,
    getProcessedFiles,
    isProcessingFiles,
    getFileStatus, // Use the debug helper
  } = useFileUpload(userId);

  // Sync processed files with the Zustand store
  useEffect(() => {
    console.log('[useChat] Syncing processed files with store:', processedFiles);
    
    // Force immediate state update with a delay to ensure UI updates
    const syncFiles = () => {
      console.log('[useChat] Setting selectedFiles in store:', processedFiles);
      setSelectedFiles(processedFiles);
    };
    
    // First immediate update
    syncFiles();
    
    // Then another update after a short delay to ensure UI refreshes
    const timer = setTimeout(() => {
      syncFiles();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [processedFiles, setSelectedFiles]);

  // --- Auth Handling ---
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id || null);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // --- Fetch Chat Histories ---
  const fetchChatHistories = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await fetchChatHistoriesAction(userId);
      setChatHistories(data.histories || []);
    } catch (error) {
      console.error("Error fetching chat histories:", error);
    }
  }, [userId]);

  // --- Real-time subscription to chat sessions ---
  useEffect(() => {
    if (!userId) return;

    // Set up real-time subscription
    const subscription = supabase
      .channel("chat-sessions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_sessions",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refresh chat histories when a change is detected
          fetchChatHistories();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, supabase, fetchChatHistories]);

  // Fetch histories when userId changes
  useEffect(() => {
    if (userId) {
      fetchChatHistories();
    }
  }, [userId, fetchChatHistories]);

  // --- Session management helpers ---
  // Memoize cookie management functions to prevent recreation
  const sessionCookieApi = useMemo(() => ({
    setSessionCookie: async (sessionId: string) => {
      try {
        await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
      } catch (error) {
        console.error("Error setting session cookie:", error);
      }
    },
    clearSessionCookie: async () => {
      try {
        await fetch("/api/session", { method: "DELETE" });
      } catch (error) {
        console.error("Error clearing session cookie:", error);
      }
    },
    getSessionCookie: async () => {
      try {
        const response = await fetch("/api/session");
        const data = await response.json();
        return data.sessionId;
      } catch (error) {
        console.error("Error getting session cookie:", error);
        return null;
      }
    },
  }), []);

  // --- Fetch Chat History for a Session ---
  const fetchChatHistory = useCallback(
    async (sessionIdToFetch: string) => {
      if (!userId) return null;
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

  // --- loadChatFromHistory ---
  const loadChatFromHistory = useCallback(
    async (id: string) => {
      setCurrentSessionId(id);
      await sessionCookieApi.setSessionCookie(id);
      router.push(`/chat/${id}`);
      
      const historyData = await fetchChatHistory(id);
      if (historyData) {
        // Check for file attachments in messages
        const messagesWithFiles = historyData.messages.filter(
          msg => (msg.files && msg.files.length > 0) || 
                 msg.content.some(c => c.type === 'file_url' || c.type === 'image_url')
        );
        
        if (messagesWithFiles.length > 0) {
          console.log(`[useChat] Found ${messagesWithFiles.length} messages with file attachments`);
          
          // Log details of the first message with files
          if (messagesWithFiles.length > 0) {
            const firstFileMsg = messagesWithFiles[0];
            console.log(`[useChat] First message with files: ${firstFileMsg.id}`, {
              explicitFiles: firstFileMsg.files?.length || 0,
              fileContentItems: firstFileMsg.content.filter(c => c.type === 'file_url' || c.type === 'image_url').length
            });
          }
        }
        
        // Ensure all messages have the necessary properties
        const processedMessages = historyData.messages.map(msg => {
          // Make sure createdAt exists (for sorting/display)
          if (!msg.createdAt) {
            msg.createdAt = Date.now();
          }
          
          // Make sure files are available for rendering
          if (!msg.files) {
            // Try to extract files from content items
            const fileContentItems = msg.content
              .filter(item => item.type === 'file_url' || item.type === 'image_url')
              .map(item => {
                if (item.type === 'file_url') {
                  const fileItem = item as { type: 'file_url', file_url: { url: string }, mime_type?: string, file_name?: string };
                  return {
                    id: `file-${Math.random().toString(36).substring(2, 9)}`,
                    name: fileItem.file_name || 'File',
                    type: 'document',
                    size: 0,
                    url: fileItem.file_url.url,
                    mime_type: fileItem.mime_type || 'application/octet-stream',
                    isImage: false
                  };
                } else {
                  const imageItem = item as { type: 'image_url', image_url: { url: string } };
                  return {
                    id: `image-${Math.random().toString(36).substring(2, 9)}`,
                    name: 'Image',
                    type: 'image',
                    size: 0,
                    url: imageItem.image_url.url,
                    mime_type: 'image/jpeg',
                    isImage: true
                  };
                }
              });
            
            if (fileContentItems.length > 0) {
              msg.files = fileContentItems;
              console.log(`[useChat] Reconstructed ${fileContentItems.length} files for message ${msg.id}`);
            }
          }
          
          return msg;
        });
        
        setMessages(processedMessages);
        
        // Set the model from the history data if available
        if (historyData.model) {
          setModel(historyData.model);
          
          // Only lock the model if there are messages in the chat
          setIsModelLocked(historyData.messages?.length > 0);
        }
      } else {
        // Clear messages if history fetch fails or is empty
        setMessages([]);
        setCurrentSessionId(null);
        await sessionCookieApi.clearSessionCookie();
      }
    },
    [
      fetchChatHistory, 
      setMessages, 
      router, 
      setCurrentSessionId, 
      setModel, 
      setIsModelLocked,
      sessionCookieApi
    ]
  );

  // Check for a saved session when initializing
  useEffect(() => {
    const initializeSession = async () => {
      if (initialSessionId && userId) {
        await loadChatFromHistory(initialSessionId);
      } else if (userId && !initialSessionId) {
        // Check if we have a session stored in cookie
        const savedSessionId = await sessionCookieApi.getSessionCookie();
        if (savedSessionId) {
          await loadChatFromHistory(savedSessionId);
        } else {
          // No session, so unlock the model
          setIsModelLocked(false);
        }
      } else if (!initialSessionId) {
        // No session ID in URL, unlock the model
        setIsModelLocked(false);
      }
    };
    
    initializeSession();
  }, [initialSessionId, userId, loadChatFromHistory, sessionCookieApi, setIsModelLocked]);

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

  // Wrap the file handlers to use our processed versions
  const handleFilesSelected = useCallback((files: FileList) => {
    console.log('[useChat] handleFilesSelected called with', files.length, 'files');
    processFiles(files);
    
    // Force a UI update by setting a temporary placeholder in the store
    const placeholders = Array.from(files).map(file => ({
      originalFile: file,
      isProcessing: true
    }));
    console.log('[useChat] Setting placeholder files:', placeholders);
    setSelectedFiles(placeholders);
  }, [processFiles, setSelectedFiles]);

  const handleRemoveFile = useCallback((index: number) => {
    console.log('[useChat] handleRemoveFile called for index', index);
    
    // Update the store immediately for responsive UI
    setSelectedFiles(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      console.log('[useChat] Updated selectedFiles after removal:', updated.length);
      return updated;
    });
    
    // Then call the useFileUpload removal function
    removeProcessedFile(index);
  }, [removeProcessedFile, setSelectedFiles]);

  // --- handleSendMessage - using already processed file attachments ---
  const handleSendMessage = useCallback(async () => {
    const trimmedInput = inputMessage.trim();

    if ((!trimmedInput && selectedFiles.length === 0) || !model) {
      console.error("Missing required data:", { inputMessage, userId, model, fileCount: selectedFiles.length });
      return;
    }

    if (!userId) {
      alert("Login obrigatório para enviar mensagens.");
      return;
    }

    if (isProcessingFiles) {
      alert("Please wait for file processing to complete");
      return;
    }

    const fileAttachments = selectedFiles
      .filter(file => file.processedFile) 
      .map(file => file.processedFile);
    
    console.log(`[useChat] Sending message with ${fileAttachments.length} file attachments:`, 
      fileAttachments.map(f => ({ id: f.id, name: f.name, url: f.url })));

    // Create file content items for the message
    const fileContentItems = fileAttachments.map(file => ({
      type: "file_url",
      file_url: { url: file.url },
      mime_type: file.mime_type,
      file_name: file.name
    }));

    // Create content array with text message (if any) and file items
    const contentArray = [];
    if (trimmedInput) {
      contentArray.push({ type: "text", text: trimmedInput });
    }
    contentArray.push(...fileContentItems);

    const optimisticUserMessage: Message = {
      id: generateUniqueId(),
      content: contentArray,
      role: "user",
      displayedContent: trimmedInput,
      pending: false,
      createdAt: Date.now(),
      files: fileAttachments, 
    };

    const optimisticLoadingMessage: Message = {
      id: generateUniqueId(),
      content: [{ type: "text", text: "" }],
      role: "assistant",
      displayedContent: "",
      pending: true,
      createdAt: Date.now(),
    };

    // Batch state updates together
    flushSync(() => {
      // Update multiple pieces of state at once to reduce renders
      setIsSubmitting(true);
      setMessages([...messages, optimisticUserMessage, optimisticLoadingMessage]);
      setInputMessage("");
      setIsModelLocked(true);
      setSelectedFiles([]);
    });

    let contextItems = [];

    // Handle web search - manual only
    if (isWebSearchEnabled && trimmedInput) {
      try {
        console.log('[useChat] Performing web search for:', trimmedInput.substring(0, 30) + '...');
        const searchResults = await performWebSearch(trimmedInput, messages);
        
        if (searchResults?.length > 0) {
          contextItems = searchResults.map((result) => ({
            type: "web_search_result",
            title: result.title,
            snippet: result.snippet,
            url: result.url,
          }));
          
          console.log(`[useChat] Found ${searchResults.length} search results`);
        } else {
          console.log(`[useChat] No search results found`);
        }
      } catch (error) {
        console.error("[useChat] Error during web search:", error);
      }
    }

    startTransition(async () => {
      let sessionId = currentSessionId;
      
      // Get the latest custom instructions directly from localStorage
      const currentCustomInstructions = typeof window !== 'undefined' 
        ? localStorage.getItem('custom-instructions') || customInstructions 
        : customInstructions;
      
      // Log the current custom instructions being used in this chat session
      console.log('[useChat] Current custom instructions when sending message:', {
        inMemory: customInstructions.substring(0, 30) + '...',
        fromLocalStorage: typeof window !== 'undefined' 
          ? (localStorage.getItem('custom-instructions') || '(none)').substring(0, 30) + '...'
          : '(not available)',
        usingForRequest: currentCustomInstructions.substring(0, 30) + '...'
      });
      
      // Create a new session if needed
      if (!sessionId && userId) {
        try {
          // Create temporary optimistic chat history entry
          const tempSessionId = `temp-${generateUniqueId()}`;
          const now = new Date().toISOString();
          const tempChatHistory: ChatHistory = {
            id: tempSessionId,
            title: trimmedInput.slice(0, 30) + (trimmedInput.length > 30 ? "..." : ""),
            created_at: now,
            updated_at: now,
          };

          // Add this temporary entry to the chat histories
          setChatHistories((prev) => [tempChatHistory, ...prev]);

          // Actually create the session on the server
          const { sessionId: newSessionId } = await createNewChatSessionAction(userId);
          sessionId = newSessionId;
          
          // Update state and navigation
          setCurrentSessionId(newSessionId);
          await sessionCookieApi.setSessionCookie(newSessionId);
          router.push(`/chat/${newSessionId}`);
        } catch (error) {
          console.error("Error creating new chat session:", error);
          // Revert temporary optimistic UI update
          setChatHistories((prev) =>
            prev.filter((chat) => !chat.id.startsWith("temp-"))
          );
        }
      }

      try {
        // Debug the capabilities being sent
        console.log('[useChat] Sending message with capabilities:', {
          webSearch: isWebSearchEnabled,
          customInstructionsLength: currentCustomInstructions?.length || 0
        });
        
        // Send the message to the AI
        const aiResponse = await sendMessageAction({
          content: trimmedInput,
          contextItems,
          fileAttachments,
          sessionId,
          userId,
          model,
          capabilities: {
            webSearch: isWebSearchEnabled,
            customInstructions: currentCustomInstructions
          }
        });
        
        // Debug the AI response
        console.log('[useChat] Received AI response:', { 
          hasResponse: !!aiResponse,
          messageId: aiResponse?.message?.id,
          contentLength: aiResponse?.message?.content?.length || 0
        });
        
        const aiMessage = aiResponse.message;
        
        // Update messages with the AI response
        setMessages((prev) =>
          prev.map((msg) =>
            msg.pending
              ? {
                  ...aiMessage,
                  id: aiMessage.id,
                  displayedContent: aiMessage.content
                    .map((c) => (c.type === "text" ? c.text : ""))
                    .join(" "),
                  pending: false,
                  createdAt: Date.now(),
                }
              : msg
          )
        );
      } catch (messageError) {
        console.error("Error sending message:", messageError);
        
        // Handle error by replacing the loading message with an error message
        setMessages((prev) => [
          ...prev.filter((msg) => !msg.pending),
          { ...createErrorMessage(), pending: false, createdAt: Date.now() },
        ]);
      } finally {
        setIsSubmitting(false);
      }
    });
  }, [
    inputMessage,
    model,
    userId,
    isProcessingFiles,
    selectedFiles,
    messages,
    isWebSearchEnabled,
    autoSearchMode,
    chatCortex,
    toggleWebSearch,
    currentSessionId,
    getProcessedFiles,
    createErrorMessage,
    setIsSubmitting,
    setMessages,
    setIsModelLocked,
    setSelectedFiles,
    setCurrentSessionId,
    sessionCookieApi,
    router,
  ]);

  // --- handleNewChat ---
  const handleNewChat = useCallback(async () => {
    // Clear cookie first
    await sessionCookieApi.clearSessionCookie();
    
    // First update UI-related states immediately
    flushSync(() => {
      setIsSubmitting(false);
      setSelectedFiles([]);
      setModel("gemini");
      setIsModelLocked(false);
    });

    // Then router navigation and state cleanup with a slight delay
    // This allows animations to start before changing routes
    setTimeout(() => {
      router.push("/chat");
      setMessages([]);
      setCurrentSessionId(null);
      setIsInitialized(false);
    }, 50);
  }, [
    router,
    setMessages,
    setCurrentSessionId,
    setSelectedFiles,
    setModel,
    setIsModelLocked,
    setIsInitialized,
    setIsSubmitting,
    sessionCookieApi,
  ]);

  // --- Session Edit/Delete Handlers ---
  const handleEditChat = useCallback(
    async (id: string, newTitle: string) => {
      if (!userId) return;

      // Optimistically update UI first for instant feedback
      setChatHistories((prev) =>
        prev.map((chat) =>
          chat.id === id ? { ...chat, title: newTitle } : chat
        )
      );

      try {
        const { chatHistory } = await editChatSessionAction({
          sessionId: id,
          userId,
          newTitle,
        });

        // If the server response is different from what we expected, update with server data
        if (chatHistory && chatHistory.title !== newTitle) {
          setChatHistories((prev) =>
            prev.map((chat) =>
              chat.id === id ? { ...chat, title: chatHistory.title } : chat
            )
          );
        }
      } catch (error) {
        console.error("Error updating chat title:", error);
        // On error, revert to original data
        fetchChatHistories();
      }
    },
    [userId, fetchChatHistories]
  );

  const handleDeleteChat = useCallback(
    async (id: string) => {
      if (!userId) return;

      // Optimistically update UI first for instant feedback
      setChatHistories((prev) => prev.filter((chat) => chat.id !== id));

      try {
        const { success } = await deleteChatSessionAction({
          sessionId: id,
          userId,
        });

        if (success) {
          // Use non-redirect toast helper
          toast(
            createSuccessToast(
              "Chat deleted",
              "The chat has been deleted successfully"
            )
          );

          // If the deleted chat is the current one, clear state and redirect
          if (currentSessionId === id) {
            flushSync(() => {
              setMessages([]);
              setCurrentSessionId(null);
            });
            
            router.push("/chat");
            await sessionCookieApi.clearSessionCookie();
          }
        } else {
          // Handle failure
          console.error("Error deleting chat session: action did not return success.");
          toast(createErrorToast("Error", "Failed to delete chat"));
          fetchChatHistories(); // Revert UI changes on error
        }
      } catch (error) {
        console.error("Error deleting chat session:", error);
        toast(createErrorToast("Error", "Failed to delete chat"));
        fetchChatHistories(); // Revert UI changes on error
      }
    },
    [
      userId,
      router,
      currentSessionId,
      setMessages,
      setCurrentSessionId,
      toast,
      fetchChatHistories,
      sessionCookieApi,
    ]
  );

  // Add multi-delete handler with optimistic updates
  const handleMultiDeleteChat = useCallback(
    async (ids: string[]) => {
      if (!userId || ids.length === 0) return;

      // Optimistically update UI first for instant feedback
      setChatHistories((prev) => prev.filter((chat) => !ids.includes(chat.id)));

      // If current session is in the list of ids to delete, clear the current session
      const shouldClearCurrentSession = currentSessionId && ids.includes(currentSessionId);
      
      if (shouldClearCurrentSession) {
        flushSync(() => {
          setMessages([]);
          setCurrentSessionId(null);
        });
        
        router.push("/chat");
        await sessionCookieApi.clearSessionCookie();
      }

      try {
        // Delete each chat session
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const result = await deleteChatSessionAction({
                sessionId: id,
                userId,
              });
              return { id, success: result.success };
            } catch (error) {
              console.error(`Error deleting chat session ${id}:`, error);
              return { id, success: false };
            }
          })
        );

        // Check for failures
        const failures = results.filter((result) => !result.success);
        if (failures.length > 0) {
          console.error(`Failed to delete ${failures.length} chat sessions.`);
          toast(createErrorToast("Partial failure", `Failed to delete ${failures.length} chat sessions`));
          fetchChatHistories(); // Refresh the whole list if there were failures
        } else {
          toast(createSuccessToast("Chats deleted", `Successfully deleted ${ids.length} chats`));
        }
      } catch (error) {
        console.error("Error in multi-delete operation:", error);
        toast(createErrorToast("Error", "Failed to delete chats"));
        fetchChatHistories(); // Revert UI changes on error
      }
    },
    [
      userId,
      router,
      currentSessionId,
      setMessages,
      setCurrentSessionId,
      toast,
      fetchChatHistories,
      sessionCookieApi,
    ]
  );

  return {
    // Return existing values
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
    isProcessingFiles,

    // Add new web search related values
    isWebSearchEnabled,
    autoSearchMode,
    toggleWebSearch,
    
    // Return existing actions
    handleFilesSelected,
    handleRemoveFile,
    handleSendMessage,
    handleNewChat,
    loadChatFromHistory,
    fetchChatHistories,
    handleEditChat,
    handleDeleteChat,
    handleMultiDeleteChat,
    setCurrentSessionId,
    toggleModelLock,
  };
};
