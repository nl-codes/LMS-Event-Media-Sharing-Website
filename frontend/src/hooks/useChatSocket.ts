"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSocket } from "@/config/socket";
import { getChatMessages, getRecentChatMessages } from "../lib/chatApi";
import type { ChatMessage } from "@/types/Chat";

interface UseChatSocketOptions {
    eventId: string;
    userId?: string;
    enabled?: boolean;
}

/**
 * Custom hook for managing real-time chat via Socket.io
 * Handles connecting to chat room, sending/receiving messages
 */
export const useChatSocket = ({
    eventId,
    userId,
    enabled = true,
}: UseChatSocketOptions) => {
    const PAGE_SIZE = 20;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!enabled || !eventId || !userId) {
            setMessages([]);
            return;
        }

        let isMounted = true;

        const loadRecentMessages = async () => {
            try {
                setIsLoading(true);
                const recentMessages = await getRecentChatMessages(
                    eventId,
                    PAGE_SIZE,
                );
                if (isMounted) {
                    setMessages(recentMessages);
                    setHasMore(recentMessages.length === PAGE_SIZE);
                }
            } catch (err) {
                if (isMounted) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : "Failed to load chat history";
                    setError(errorMessage);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        void loadRecentMessages();

        return () => {
            isMounted = false;
        };
    }, [enabled, eventId, userId]);

    const loadOlderMessages = useCallback(async () => {
        if (!enabled || !eventId || !userId || isLoadingOlder || !hasMore) {
            return;
        }

        try {
            setIsLoadingOlder(true);
            const olderMessages = await getChatMessages(
                eventId,
                PAGE_SIZE,
                messages.length,
            );

            setMessages((prev) => {
                const knownIds = new Set(prev.map((message) => message._id));
                const uniqueOlder = olderMessages.filter(
                    (message) => !knownIds.has(message._id),
                );

                return [...uniqueOlder, ...prev];
            });

            setHasMore(olderMessages.length === PAGE_SIZE);
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "Failed to load older messages";
            setError(errorMessage);
        } finally {
            setIsLoadingOlder(false);
        }
    }, [enabled, eventId, userId, isLoadingOlder, hasMore, messages.length]);

    /**
     * Scroll to bottom of messages when new messages arrive
     */
    const scrollToBottom = useCallback(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    /**
     * Initialize socket connection and event handlers
     */
    useEffect(() => {
        if (!enabled || !eventId || !userId) return;

        const socket = getSocket();
        socketRef.current = socket;

        const handleConnect = () => {
            console.log("✅ Socket connected");
            setIsConnected(true);
            // Join the chat room for this event
            socket.emit("join_chat_room", eventId);
        };

        const handleDisconnect = () => {
            console.log("❌ Socket disconnected");
            setIsConnected(false);
        };

        /**
         * Receive messages from other users
         */
        const handleReceiveMessage = (message: ChatMessage) => {
            console.log("📨 Message received:", message);
            setMessages((prev) => {
                if (prev.some((existing) => existing._id === message._id)) {
                    return prev;
                }

                return [...prev, message];
            });
        };

        /**
         * Handle message errors
         */
        const handleMessageError = (data: { error: string }) => {
            console.error("❌ Message error:", data.error);
            setError(data.error);
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("receive_message", handleReceiveMessage);
        socket.on("message_error", handleMessageError);

        // Connect the socket
        if (!socket.connected) {
            socket.connect();
        }

        // Clean up on unmount
        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("receive_message", handleReceiveMessage);
            socket.off("message_error", handleMessageError);
            socket.emit("leave_chat_room", eventId);
        };
    }, [enabled, eventId, userId]);

    /**
     * Send a message to the chat room
     */
    const sendMessage = useCallback(
        async (text: string, senderName: string, senderEmail: string) => {
            if (!socketRef.current || !isConnected) {
                setError("Socket not connected");
                return;
            }

            if (!text.trim()) {
                setError("Message cannot be empty");
                return;
            }

            try {
                socketRef.current.emit("send_message", {
                    eventId,
                    senderId: userId,
                    senderName,
                    senderEmail,
                    text: text.trim(),
                });
                setError(null);
            } catch (err) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : "Failed to send message";
                setError(errorMessage);
            }
        },
        [isConnected, eventId, userId],
    );

    /**
     * Clear messages (useful for cleanup)
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    /**
     * Clear error
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        messages,
        isConnected,
        isLoading,
        isLoadingOlder,
        hasMore,
        error,
        sendMessage,
        loadOlderMessages,
        clearMessages,
        clearError,
        messageEndRef,
    };
};
