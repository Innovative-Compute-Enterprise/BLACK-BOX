"use client";

import { generateUniqueId } from "@/src/utils/uniqueId";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { flushSync } from "react-dom";
import { startTransition } from "react";
import { useRouter } from "next/navigation";
import { 
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

  // Ref to track ongoing session creation to coordinate with real-time updates
  const isCreatingSessionRef = useRef(false);
  // Ref to store the ID of the session just created locally
  const recentlyCreatedSessionIdRef = useRef<string | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        (payload) => { // <-- Accept payload
          // If it's an INSERT event AND the new record's ID matches the one we just created locally...
          if (payload.eventType === 'INSERT' && payload.new?.id && payload.new.id === recentlyCreatedSessionIdRef.current) {
              console.log('[useChat] Subscription INSERT matches recently created session. Skipping fetch.');
              // We already handled this optimistically and then manually updated it with the real ID.
              // Clear the ref now as this confirmation means the DB has the record.
              recentlyCreatedSessionIdRef.current = null;
              return;
          }
          // Also skip if the main creation flag is still active (covers edge cases/timing)
          if (isCreatingSessionRef.current) {
             console.log('[useChat] Subscription triggered during optimistic creation phase. Skipping fetch.');
             return;
          }
          console.log('[useChat] Subscription triggered for other change, fetching chat histories.');
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
        
        // Assume messages from historyData are correctly structured
        const processedMessages = historyData.messages.map(msg => {
          // Ensure createdAt exists (for sorting/display)
          if (!msg.createdAt) {
            console.warn(`[useChat] Message ${msg.id} missing createdAt, adding default.`);
            msg.createdAt = Date.now();
          }
          // Ensure content is an array
          if (!Array.isArray(msg.content)) {
             console.warn(`[useChat] Message ${msg.id} content is not an array, wrapping.`);
             // Attempt to wrap based on previous structure, otherwise log error
             if (typeof msg.content === 'string') {
               msg.content = [{ type: 'text', text: msg.content }];
             } else {
               console.error(`[useChat] Cannot process non-array, non-string content for message ${msg.id}. Setting to empty.`);
               msg.content = [];
             }
          }
          // Ensure files array exists if there are file content items (basic check)
          if (!msg.files && msg.content.some(c => c.type === 'file_url' || c.type === 'image_url')) {
            console.warn(`[useChat] Message ${msg.id} has file content items but missing files array. Downstream rendering might fail.`);
            // Do not attempt reconstruction, rely on backend correctness
            msg.files = []; // Add empty array to satisfy type if needed
          }
          
          return msg;
        });
        
        setMessages(processedMessages);
        
        if (historyData.model) {
          setModel(historyData.model);
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
    
    console.log(`[useChat] Sending message with ${fileAttachments.length} file attachments`);

    // Create file content items for the message
    const fileContentItems = fileAttachments.map(file => ({
      type: file.isImage ? "image_url" : "file_url", // Use correct type based on attachment
      [file.isImage ? "image_url" : "file_url"]: { url: file.url },
      mime_type: file.mime_type,
      file_name: file.name
    }));

    // Create content array for optimistic update
    const contentArray = [];
    if (trimmedInput) {
      contentArray.push({ type: "text", text: trimmedInput });
    }
    contentArray.push(...fileContentItems);

    // Ensure contentArray is not empty before proceeding
    if (contentArray.length === 0) {
        console.error("Cannot send an empty message (no text and no valid files).");
        return;
    }

    const optimisticUserMessage: Message = {
      id: generateUniqueId(),
      content: contentArray, // Use the array format
      role: "user",
      displayedContent: trimmedInput, // Keep text for display if needed
      pending: false,
      createdAt: Date.now(),
      files: fileAttachments, // Keep attaching files for rendering
    };

    const optimisticLoadingMessage: Message = {
      id: generateUniqueId(),
      content: [{ type: "text", text: "" }], // Still needs valid content structure
      role: "assistant",
      displayedContent: "",
      pending: true,
      createdAt: Date.now(),
    };

    // --- Optimistic UI Update for New Session (if applicable) ---
    let tempSessionId: string | null = null; // Keep track of temp ID if created
    if (!currentSessionId && userId) {
        tempSessionId = `temp-${generateUniqueId()}`;
        const now = new Date().toISOString();
        const tempChatHistory: ChatHistory = {
          id: tempSessionId,
          title: trimmedInput.slice(0, 30) + (trimmedInput.length > 30 ? "..." : ""),
          created_at: now,
          updated_at: now,
        };
        // Prepend optimistically *before* starting the transition
        setChatHistories((prev) => [tempChatHistory, ...prev]);
        console.log('[useChat] Optimistically added temp session history:', tempSessionId);
    }

    // Batch state updates together
    flushSync(() => {
      setIsSubmitting(true);
      // Use the correctly typed optimistic messages
      setMessages([...messages, optimisticUserMessage, optimisticLoadingMessage]);
      setInputMessage("");
      setIsModelLocked(true);
      setSelectedFiles([]);
    });

    startTransition(async () => {
      let sessionId = currentSessionId;
      const currentCustomInstructions = typeof window !== 'undefined' 
        ? localStorage.getItem('custom-instructions') || customInstructions 
        : customInstructions;

      // --- Create a new session if needed ---
      if (!sessionId && userId && tempSessionId) {
        try {
          // --- Signal that optimistic creation is starting ---
          isCreatingSessionRef.current = true; 
          console.log('[useChat] Set isCreatingSessionRef flag to true.');
          
          // --- Actually create the session on the server ---
          console.log('[useChat] Calling createNewChatSessionAction');
          const { sessionId: newSessionId } = await createNewChatSessionAction(userId);
          sessionId = newSessionId; // Use the new ID for the subsequent message send
          console.log('[useChat] New session created:', newSessionId);
          
          // --- Update state with the real ID ---
          // Store the newly created ID in the ref for the subscription handler
          recentlyCreatedSessionIdRef.current = newSessionId;
          // Replace the temporary chat history item with one using the real ID
          // Ensure we create a new array reference for the state update.
          setChatHistories((prev) => {
             const updatedHistories = prev.map((chat) =>
                chat.id === tempSessionId ? { ...chat, id: newSessionId, title: chat.title } : chat // Ensure title persists
             );
             console.log(`[useChat] Manually updated chatHistories state for new session ${newSessionId}. New length: ${updatedHistories.length}`);
             return updatedHistories; // Return the new array
          });
          
          // Update current session ID and push route
          setCurrentSessionId(newSessionId);
          await sessionCookieApi.setSessionCookie(newSessionId);
          router.push(`/chat/${newSessionId}`);
          
        } catch (error) {
          console.error("Error creating new chat session:", error);
          // Revert temporary optimistic UI update on error
          setChatHistories((prev) =>
            // Use the tempSessionId captured before the transition
            prev.filter((chat) => chat.id !== tempSessionId) 
          );
          // Ensure flag is reset even on error
          isCreatingSessionRef.current = false;
          // Optionally, handle the error state further (e.g., show toast)
          
          // We cannot proceed with sending the message if session creation failed
          setIsSubmitting(false); // Reset submitting state
          setMessages((prev) => prev.filter(msg => !msg.pending)); // Remove loading indicator
          toast(createErrorToast("Error", "Could not create new chat session.")); // Inform user
          return; // Exit the transition

        } finally {
          // --- Signal that optimistic creation is finished ---
          // Reset the flag after a very short delay to allow the subscription
          // handler to potentially ignore the immediate trigger from this creation.
          setTimeout(() => {
            isCreatingSessionRef.current = false;
            // Also clear the recently created ID ref after a slightly longer delay,
            // ensuring the subscription has had a chance to see it if needed.
            setTimeout(() => {
                recentlyCreatedSessionIdRef.current = null;
                console.log('[useChat] Cleared recentlyCreatedSessionIdRef after second timeout.');
            }, 200); // e.g., 200ms after the first timeout
            console.log('[useChat] Reset isCreatingSessionRef flag after timeout.');
          }, 150); // Adjust delay as needed (e.g., 100-150ms for the main flag)
        }
      }
      // --- End of New Session Creation Block ---

      // Proceed with sending the message (either to existing or new session)
      try {
        if (!sessionId) {
          // This case should ideally not be reached if creation failed and returned early
          throw new Error("Session ID is missing after potential creation attempt.");
        }
        
        console.log('[useChat] Sending message with capabilities:', {
          webSearch: isWebSearchEnabled,
          customInstructionsLength: currentCustomInstructions?.length || 0,
          fileCount: fileAttachments.length
        });
        
        // Send the message to the AI - Pass text and files separately
        const aiResponse = await sendMessageAction({
          content: trimmedInput, // Pass the text string
          fileAttachments, // Pass the processed file info array
          sessionId,
          userId,
          model,
          capabilities: {
            webSearch: isWebSearchEnabled, // Server action will use this flag
            customInstructions: currentCustomInstructions
          }
        });
        
        const aiMessage = aiResponse.message;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.pending
              ? { // Replace pending message
                  ...aiMessage,
                  // Ensure structure matches Message type
                  id: aiMessage.id || generateUniqueId(), 
                  content: Array.isArray(aiMessage.content) ? aiMessage.content : [{ type: 'text', text: String(aiMessage.content || '')}],
                  displayedContent: Array.isArray(aiMessage.content) 
                    ? aiMessage.content.map((c) => (c.type === "text" ? c.text : "")).join(" ")
                    : String(aiMessage.content || ''),
                  pending: false,
                  createdAt: aiMessage.createdAt || Date.now(),
                  files: aiMessage.files || [], // Ensure files array exists
                  role: aiMessage.role || 'assistant'
                }
              : msg
          )
        );
      } catch (messageError) {
        console.error("Error sending message:", messageError);
        
        // Handle error by replacing the loading message with an error message
        setMessages((prev) => [
          ...prev.filter((msg) => !msg.pending),
          { ...createErrorMessage(), pending: false, createdAt: Date.now() }, // Ensure error message fits type
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
    currentSessionId,
    createErrorMessage,
    setIsSubmitting,
    setMessages,
    setIsModelLocked,
    setSelectedFiles,
    setCurrentSessionId,
    sessionCookieApi,
    router,
    customInstructions,
    toast,
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
