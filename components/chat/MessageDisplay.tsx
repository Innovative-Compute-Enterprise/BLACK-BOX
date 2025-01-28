'use client'

import React, {
    useMemo,
    useRef,
    useEffect,
    useState,
    useCallback
} from 'react'
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso'
import { Message } from '../../types/chat'
import { useIsMobile } from '@/hooks/use-mobile'
import BlackBox from '../icons/BlackBox'
import MessageRow from './message/messageRow'
import LoadingSpinner from './message/loading'

interface MessageDisplayProps {
    messages: Message[]
    loadingOlderMessages?: boolean
    loadOlderMessages?: () => void
}

const MessageDisplay: React.FC<MessageDisplayProps> = React.memo(({
    messages,
    loadingOlderMessages = false,
    loadOlderMessages
}) => {
    const virtuosoRef = useRef<VirtuosoHandle | null>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const bottomRef = useRef<HTMLDivElement | null>(null)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
    const isMobile = useIsMobile()
    const [overscan, setOverscan] = useState(isMobile ? 200 : 400)
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    // Memoize validMessages
    const validMessages = useMemo(
        () => (Array.isArray(messages) ? messages : []),
        [messages]
    );

    // Stable handleCopy callback
    const handleCopy = useCallback((id: string) => {
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        setCopiedId(id);
        copyTimeoutRef.current = setTimeout(() => setCopiedId(null), 1000);
    }, []);

    // Stable handleScroll callback
    const handleScroll = useCallback((atBottom: boolean) => {
        setShouldAutoScroll(atBottom);
    }, []);

    useEffect(() => {
        if (virtuosoRef.current && validMessages.length > 0) {
            virtuosoRef.current.scrollToIndex({
                index: validMessages.length - 1,
                behavior: shouldAutoScroll ? 'smooth' : 'auto',
                align: 'end',
            });
        }
    }, [validMessages, shouldAutoScroll]);


    const rowRenderer = useCallback(
        (index: number) => {
            const message = validMessages[index];
            const isLast = index === validMessages.length - 1;
            const isAssistant = message?.role === 'assistant';

            return (
                <div key={message.id} className="w-full max-w-2xl mx-auto py-3">
                    <div className={`flex flex-col md:flex-row`}>
                        {isAssistant && (
                            <div className="flex-shrink-0 self-start md:self-start md:mt-2.5 mb-0 md:mr-3">
                                <div className="p-2 rounded-full border border-black/20 dark:border-white/20">
                                    <BlackBox className="w-4 h-4 text-primary" />
                                </div>
                            </div>
                        )}
                        <div className="flex-grow w-full" style={{ flexBasis: '0' }}>
                            <MessageRow
                                message={message}
                                copiedId={copiedId}
                                handleCopy={handleCopy}
                                index={index}
                                isLast={isLast}
                            />
                        </div>
                    </div>
                </div>
            );
        },
        [validMessages, copiedId, handleCopy]
    );

    const LoadingHeader = useCallback(() => {
        if (loadingOlderMessages) {
            return <LoadingSpinner />;
        }
        return <div className="h-16" />;
    }, [loadingOlderMessages]);

    const Footer = useCallback(() => {
        return <div ref={bottomRef} className="h-16" />;
    }, []);

    useEffect(() => {
        let resizeTimeout: NodeJS.Timeout;
        const calculateOverscan = () => {
            if (containerRef.current) {
                const { clientHeight } = containerRef.current;
                const baseOverscan = isMobile ? 200 : 400;
                const dynamicOverscan = Math.max(
                    baseOverscan,
                    Math.ceil(clientHeight / 100)
                );
                setOverscan(dynamicOverscan);
            }
        };

        const debouncedCalculateOverscan = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(calculateOverscan, 200);
        };

        calculateOverscan();
        window.addEventListener('resize', debouncedCalculateOverscan);
        return () => {
            window.removeEventListener('resize', debouncedCalculateOverscan);
            clearTimeout(resizeTimeout);
        };
    }, [isMobile]);

    return (
        <div
            ref={containerRef}
            className="flex items-center justify-center h-full w-full bg-background px-6 md:px-0"
        >
            <Virtuoso
                ref={virtuosoRef}
                style={{ height: '100%', width: '100%' }}
                totalCount={validMessages.length}
                itemContent={rowRenderer}
                overscan={overscan}
                className="overflow-y-hidden"
                followOutput={true}
                atBottomStateChange={handleScroll}
                components={{
                    Header: LoadingHeader,
                    Footer: Footer,
                }}
                startReached={loadOlderMessages}
            />
        </div>
    );
});

MessageDisplay.displayName = 'MessageDisplay';
export default MessageDisplay;