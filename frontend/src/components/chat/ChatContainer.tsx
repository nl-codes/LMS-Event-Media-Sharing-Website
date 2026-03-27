"use client";

import React, { useMemo, useRef, useState } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import MessageInput from "@/components/chat/MessageInput";
import { useUser } from "@/context/UserContext";
import type { ChatMessage } from "@/types/Chat";

interface ChatContainerProps {
    eventId: string;
    eventName: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
    eventId,
    eventName,
}) => {
    const { user } = useUser();
    const [inputValue, setInputValue] = useState("");
    const isGuest = !user || !user._id;
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    // Initialize socket hook
    const {
        messages,
        isConnected,
        isLoading,
        isLoadingOlder,
        hasMore,
        error,
        sendMessage,
        loadOlderMessages,
        clearError,
        messageEndRef,
    } = useChatSocket({
        eventId,
        userId: user?._id || "",
        enabled: !isGuest,
    });

    const displayMessages = useMemo(() => {
        return [...messages].sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
        );
    }, [messages]);

    const getSenderId = (message: ChatMessage): string => {
        if (typeof message.senderId === "string") {
            return message.senderId;
        }

        return message.senderId?._id || "";
    };

    const handleMessagesScroll = async (
        event: React.UIEvent<HTMLDivElement>,
    ) => {
        if (!hasMore || isLoadingOlder) {
            return;
        }

        const container = event.currentTarget;
        if (container.scrollTop > 80) {
            return;
        }

        const previousScrollHeight = container.scrollHeight;
        const previousScrollTop = container.scrollTop;

        await loadOlderMessages();

        requestAnimationFrame(() => {
            const activeContainer = messagesContainerRef.current;
            if (!activeContainer) {
                return;
            }

            const nextScrollHeight = activeContainer.scrollHeight;
            activeContainer.scrollTop =
                nextScrollHeight - previousScrollHeight + previousScrollTop;
        });
    };

    /**
     * Handle sending a message
     */
    const handleSendMessage = async (text: string) => {
        if (!user?._id) {
            console.warn("User is not authenticated");
            return;
        }

        try {
            await sendMessage(
                text,
                user.userName || "Anonymous",
                user.email || "unknown@email.com",
            );
            setInputValue("");
            clearError();
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    // Show placeholder for guests
    if (isGuest) {
        return (
            <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6 h-[600px] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-400 mb-2">
                        💬 Group Chat for {eventName}
                    </p>
                    <p className="text-slate-500 text-sm">
                        Login to participate in the group chat
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 rounded-lg border border-slate-700 h-[600px] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
                <div>
                    <h3 className="text-white font-semibold text-sm">
                        Group Chat
                    </h3>
                    <p className="text-slate-400 text-xs">
                        {eventName}
                        {isConnected && (
                            <span className="ml-2 inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                        )}
                    </p>
                </div>
                {error && (
                    <div className="bg-red-500/10 text-red-400 text-xs px-3 py-1 rounded">
                        {error}
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingOlder && (
                    <div className="text-xs text-slate-400 text-center py-1">
                        Loading older messages...
                    </div>
                )}
                {displayMessages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-slate-500 text-sm text-center">
                            {isLoading
                                ? "Loading chat history..."
                                : "No messages yet. Start the conversation!"}
                        </p>
                    </div>
                ) : (
                    displayMessages.map((message) => {
                        const isCurrentUser =
                            getSenderId(message) === user?._id;

                        return (
                            <div
                                key={message._id}
                                className={`flex ${
                                    isCurrentUser
                                        ? "justify-end"
                                        : "justify-start"
                                }`}>
                                <div
                                    className={`max-w-xs rounded-lg px-4 py-2 ${
                                        isCurrentUser
                                            ? "bg-blue-600 text-white rounded-br-none"
                                            : "bg-slate-700 text-slate-100 rounded-bl-none"
                                    }`}>
                                    {!isCurrentUser && (
                                        <p className="text-xs font-semibold text-slate-300 mb-1">
                                            {message.senderName}
                                        </p>
                                    )}
                                    <p className="text-sm wrap-break-word">
                                        {message.text}
                                    </p>
                                    <p
                                        className={`text-xs mt-1 ${
                                            isCurrentUser
                                                ? "text-blue-200"
                                                : "text-slate-500"
                                        }`}>
                                        {new Date(
                                            message.createdAt,
                                        ).toLocaleTimeString("en-US", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messageEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-slate-800 border-t border-slate-700 p-4">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    disabled={!isConnected}
                    placeholder="Type a message..."
                    value={inputValue}
                    onChange={setInputValue}
                />
            </div>
        </div>
    );
};

export default ChatContainer;
