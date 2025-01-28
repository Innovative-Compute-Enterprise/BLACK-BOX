'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import GraphemeSplitter from 'grapheme-splitter';
import MessageBubble from './messageBubble';
import MessageActions from './messageActions';
import { Message, MessageContent } from '@/types/chat';

interface MessageRowProps {
    message: Message;
    copiedId?: string | null;
    handleCopy: (id: string) => void;
    index: number;
    isLast: boolean;
}

const TYPING_SPEED = 3; // Not directly used, controlling speed via update frequency now
const GRAPHEME_SPLITTER = new GraphemeSplitter();

const MessageRow: React.FC<MessageRowProps> = React.memo(({
    message,
    copiedId,
    handleCopy,
    isLast,
}) => {
    const isUser = message.role === 'user';
    const [currentContent, setCurrentContent] = useState<MessageContent[]>([]);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isUser) {
            setCurrentContent([]);
        } else {
            setCurrentContent(message.content);
        }
    }, [message.content, isUser]);

    const updateContent = useCallback((newContent: MessageContent[]) => {
        setCurrentContent(newContent);
    }, []);

    const typeAnimation = useCallback(() => {
        if (message.role === 'assistant' && message.pending && isLast) {
            let contentIndex = 0;
            let charIndex = 0;
            let accumulatedContent: MessageContent[] = [];

            const typeNextCharacter = () => {
                if (contentIndex >= message.content.length) {
                    animationFrameRef.current = null;
                    return;
                }

                const currentItem = message.content[contentIndex];

                if (currentItem.type !== 'text') {
                    accumulatedContent.push(currentItem);
                    updateContent([...accumulatedContent]);
                    contentIndex++;
                    animationFrameRef.current = requestAnimationFrame(typeNextCharacter);
                    return;
                }

                const characters = GRAPHEME_SPLITTER.splitGraphemes(currentItem.text);

                if (charIndex < characters.length) {
                    const currentText = characters.slice(0, charIndex + 1).join('');
                    accumulatedContent = [
                        ...accumulatedContent.slice(0, contentIndex),
                        { type: 'text', text: currentText },
                        ];
                    // **Increased update frequency - every character update**
                    updateContent([...accumulatedContent]); // Update every character
                    charIndex++;
                } else {
                    contentIndex++;
                    charIndex = 0;
                }
                animationFrameRef.current = requestAnimationFrame(typeNextCharacter);
            };

            const startAnimation = () => {
                if (!animationFrameRef.current) {
                    animationFrameRef.current = requestAnimationFrame(typeNextCharacter);
                }
            };

            startAnimation();
            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                    animationFrameRef.current = null;
                }
            };
        } else if (message.role === 'assistant' && !message.pending) {
            updateContent(message.content);
        }
    }, [message, isLast, updateContent]);

    useEffect(() => {
        typeAnimation();
    }, [typeAnimation]);

    return (
        <React.Fragment key={message.id}>
            <div className={`mb-9 ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                    className={` inline-block w-full max-w-screen ${isUser ? 'flex justify-end' : 'justify-start'
                        }`}
                >
                    <MessageBubble
                        message={{
                            ...message,
                            content: currentContent,
                            pending: message.pending,
                        }}
                    />

                    {!isUser && (
                        <MessageActions
                            message={message}
                            copiedId={copiedId}
                            handleCopy={handleCopy}
                        />
                    )}
                </div>
            </div>
        </React.Fragment>
    );
});

export default React.memo(MessageRow);