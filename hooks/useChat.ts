// hooks/useChat.ts
'use client';

import { generateUniqueId } from "@/utils/uniqueId";
import { useCallback, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatStore } from "./useChatStore";
import { Message, ChatHistory } from "@/types/chat";
import { useFileUpload } from "./useFIleUpload";
import { useChatContext } from "@/context/ChatContext";
import { createClient } from '@/utils/supabase/client';
import { createNewChatSessionAction, sendMessageAction } from '@/src/app/actions'; // Import Server Actions

interface UseChatProps {
    sessionId?: string;
}

export const useChat = ({ sessionId: initialSessionId }: UseChatProps) => {
    const router = useRouter();
    const supabase = createClient();

    // --- State from useChatSession ---
    const [userId, setUserId] = useState<string | null>(null);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialSessionId || null);
    const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
    // --- State from useChat ---
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inputMessage, setInputMessage] = useState("");

    // --- Context from useChatContext ---
    const { model, setModel, isModelLocked, setIsModelLocked, isInitialized, setIsInitialized } = useChatContext();

    // --- Store from useChatStore ---
    const { messages, setMessages } = useChatStore(); // Assuming you only need messages and setMessages

    // --- File Upload from useFileUpload ---
    const {
        selectedFiles,
        handleFilesSelected,
        handleRemoveFile,
        processAndUploadFiles,
        setSelectedFiles,
    } = useFileUpload(userId); // userId will be available later


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
            const response = await fetch(`/api/chat-sessions?userId=${userId}`);
            const data = await response.json();
            if (!data.error) {
                setChatHistories(data.histories || []);
            }
        } catch (error) {
            console.error('Error fetching chat histories:', error);
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
            } else {
                setMessages([]); // Clear messages if history fetch fails or is empty
            }
            setCurrentSessionId(id); // Update currentSessionId in state
            router.push(`/chat/${id}`); // Navigate to the sessioned route
        },
        [fetchChatHistory, setMessages, router, setCurrentSessionId]
    );

    useEffect(() => {
        if (initialSessionId && userId) {
            loadChatFromHistory(initialSessionId); // Load chat if sessionId is provided on mount
        }
    }, [initialSessionId, userId, loadChatFromHistory]);


    // --- Message Creation Functions (From useChat - No Change Needed) ---
    const createUserMessage = useCallback(
        (text: string): Message => ({
            id: generateUniqueId(),
            content: [{ type: "text", text: text.trim() }],
            role: "user",
            displayedContent: text.trim(),
            createdAt: Date.now(),
        }),
        []
    );

    const createLoadingMessage = useCallback(

        (): Message => ({

            id: generateUniqueId(),

            content: [{ type: "text", text: "" }],

            displayedContent: "",

            role: "assistant",

            pending: true,

            createdAt: Date.now(),

        }),

        []

    );
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
    const handleSendMessage = useCallback(async () => {
        if (!inputMessage.trim() && selectedFiles.length === 0 || !userId || !model) {
            console.error("Missing required data:", { inputMessage, userId, model, selectedFiles });
            return;
        }

        setIsModelLocked(true);
        setIsSubmitting(true);
        setInputMessage("");
        setSelectedFiles([]);

        let activeSessionId = currentSessionId;

        if (!activeSessionId) {
            // --- NEW SESSION CREATION USING SERVER ACTION ---
            console.log("Creating new chat session...");
            try {
                const sessionResponse = await createNewChatSessionAction(userId); 
                const newSessionId = sessionResponse.sessionId;
                console.log("New session created. Session ID:", newSessionId); 

                activeSessionId = newSessionId;
                setCurrentSessionId(newSessionId);
                router.push(`/chat/${newSessionId}`);  
                await fetchChatHistories(); 

                const userMessage = createUserMessage(inputMessage);
                const loadingMessage = createLoadingMessage();

                setMessages((prev) => { // Log before setting messages - user and loading
                    const updatedMessages = [
                        ...prev, 
                        { ...userMessage, pending: false, createdAt: Date.now() },
                        { ...loadingMessage, pending: true, createdAt: Date.now() }];
                    console.log("Setting messages (user+loading) in new session:", updatedMessages);
                    return updatedMessages;
                });

                try {
                    console.log("Sending message to AI..."); // Log before sendMessageAction call
                    const aiResponse = await sendMessageAction({ // Call sendMessage Server Action
                        content: inputMessage,
                        sessionId: activeSessionId,
                        userId,
                        model
                    });
                    const aiMessage = aiResponse.message;
                    console.log("AI Response received:", aiMessage); // Log AI message

                    // Update messages state with AI response
                    setMessages((prev) => {
                        const updatedMessages = prev.map((msg) => {
                            if (msg.pending) {
                                const updatedMsg = {
                                    ...aiMessage,
                                    id: aiMessage.id, // Ensure ID is preserved
                                    displayedContent: aiMessage.content[0]?.type || "",
                                    pending: false,
                                    createdAt: Date.now(),
                                };
                                console.log("Replacing pending message with AI response:", updatedMsg); // Log replacement
                                return updatedMsg;
                            }
                            return msg;
                        });
                        console.log("Setting messages (AI response updated):", updatedMessages); // Log final messages state
                        return updatedMessages;
                    });


                } catch (messageError) {
                    console.error("Error in message handling (new session):", messageError);
                    setMessages((prev) => [
                        ...prev.filter((msg) => !msg.pending),
                        { ...createErrorMessage(), pending: false, createdAt: Date.now() },
                    ]);
                } finally {
                    setIsSubmitting(false);
                    setIsModelLocked(false);
                }
                return; // Exit after new session flow


            } catch (sessionError) {
                console.error("Error creating new session:", sessionError);
                return;
            }
        }


        // --- EXISTING SESSION MESSAGE SENDING (using Server Action) ---
        const userMessage = createUserMessage(inputMessage);
        const loadingMessage = createLoadingMessage();

        setMessages((prev) => { 
            const updatedMessages = [
                ...prev, 
                { ...userMessage, pending: false, createdAt: Date.now() }, 
                { ...loadingMessage, pending: true, createdAt: Date.now() }];

            console.log("Setting messages (user+loading) in existing session:", updatedMessages);
            return updatedMessages;
        });


        try {
            console.log("Sending message to AI (existing session)..."); // Log before sendMessageAction call
            const aiResponse = await sendMessageAction({ // Call sendMessage Server Action
                content: inputMessage,
                sessionId: activeSessionId,
                userId,
                model
            });
            const aiMessage = aiResponse.message;
            console.log("AI Response received (existing session):", aiMessage); // Log AI message

            // Update messages state with AI response
            setMessages((prev) => {
                const updatedMessages = prev.map((msg) => {
                    if (msg.pending) {
                        const updatedMsg = {
                            ...aiMessage,
                            id: aiMessage.id, // Ensure ID is preserved
                            displayedContent: aiMessage.content[0]?.type || "",
                            pending: false,
                            createdAt: Date.now(),
                        };
                        console.log("Replacing pending message with AI response (existing session):", updatedMsg); // Log replacement
                        return updatedMsg;
                    }
                    return msg;
                });
                console.log("Setting messages (AI response updated - existing session):", updatedMessages); // Log final messages state
                return updatedMessages;
            });


        } catch (messageError) {
            console.error("Error in message handling (existing session):", messageError);
            setMessages((prev) => [
                ...prev.filter((msg) => !msg.pending),
                { ...createErrorMessage(), pending: false, createdAt: Date.now() },
            ]);
        } finally {
            setIsSubmitting(false);
            setIsModelLocked(false);
        }


    }, [
        inputMessage,
        userId,
        model,
        currentSessionId,
        selectedFiles,
        router,
        fetchChatHistories,
        processAndUploadFiles,
        createUserMessage,
        createLoadingMessage,
        createErrorMessage,
        setMessages,
        setIsModelLocked
    ]);


    // --- handleNewChat (Modified & Combined from useChat & useChatSession actions) ---
    const handleNewChat = useCallback(() => {
        setMessages([]);
        router.push("/chat");
        setCurrentSessionId(null);
        setModel("gemini");
        setIsModelLocked(false);
        setIsInitialized(false);
    }, [setMessages, router, setCurrentSessionId, setModel, setIsModelLocked, setIsInitialized]);


    // --- Session Edit/Delete Handlers ---
    const handleEditChat = useCallback(
        async (id: string, newTitle: string) => {
            if (!userId) return;

            try {
                const response = await fetch('/api/chat-sessions', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, title: newTitle, userId }),
                });
                const data = await response.json();
                if (!data.error) {
                    setChatHistories((prev) =>
                        prev.map((chat) =>
                            chat.id === id ? { ...chat, title: newTitle } : chat
                        )
                    );
                }
            } catch (error) {
                console.error('Error updating chat title:', error);
            }
        },
        [userId, setChatHistories]
    );

    const handleDeleteChat = useCallback(
        async (id: string) => {
            if (!userId) return;
            try {
                const response = await fetch(`/api/chat-sessions/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }),
                });
                if (response.ok) {
                    setMessages([]);
                    setCurrentSessionId(null);
                    router.push('/chat');
                    setChatHistories((prev) => prev.filter((chat) => chat.id !== id));
                } else {
                    console.error('Error deleting chat, server response not OK', response);
                }
            } catch (error) {
                console.error('Error deleting chat:', error);
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