"use client";

import React, { useMemo, useRef } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import MessageInput from "@/components/chat/MessageInput";
import { useUser } from "@/context/UserContext";
import { MessageSquare, ShieldAlert, Loader2, Circle } from "lucide-react";

interface ChatContainerProps {
    eventId: string;
    eventName: string;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({
    eventId,
    eventName,
}) => {
    const { user } = useUser();
    const isGuest = !user || !user._id;
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

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

    const handleMessagesScroll = async (
        event: React.UIEvent<HTMLDivElement>,
    ) => {
        if (!hasMore || isLoadingOlder) return;
        const container = event.currentTarget;
        if (container.scrollTop > 80) return;
        await loadOlderMessages();
    };

    const handleSendMessage = async (text: string) => {
        if (!user?._id) return;
        try {
            await sendMessage(
                text,
                user.userName || "Anonymous",
                user.email || "",
            );
            clearError();
        } catch (err) {
            console.error(err);
        }
    };

    if (isGuest) {
        return (
            <div className="bg-white/40 backdrop-blur-xl border border-slate-200 rounded-[2.5rem] p-12 h-[600px] flex flex-col items-center justify-center text-center shadow-sm">
                <div className="bg-cusblue/10 p-4 rounded-3xl mb-4 text-cusblue">
                    <MessageSquare size={32} />
                </div>
                <h3 className="text-xl font-bold text-cusblue mb-2">
                    Join the Conversation
                </h3>
                <p className="text-cusviolet/60 text-sm max-w-60">
                    Login to participate in the group chat for{" "}
                    <strong>{eventName}</strong>
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] h-[650px] flex flex-col overflow-hidden shadow-xl shadow-slate-200/50">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-cusblue to-cusviolet flex items-center justify-center text-white shadow-lg shadow-cusblue/20">
                        <MessageSquare size={20} />
                    </div>
                    <div>
                        <h3 className="text-cusblue font-black text-sm uppercase tracking-tight">
                            Group Chat
                        </h3>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-400 truncate max-w-[150px] uppercase tracking-widest">
                                {eventName}
                            </span>
                            {isConnected && (
                                <Circle
                                    size={6}
                                    className="fill-green-500 text-green-500 animate-pulse"
                                />
                            )}
                        </div>
                    </div>
                </div>
                {error && (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-500 text-[10px] font-bold px-3 py-1.5 rounded-full border border-rose-100">
                        <ShieldAlert size={12} />
                        {error}
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-linear-to-b from-transparent to-slate-50/50">
                {isLoadingOlder && (
                    <div className="flex justify-center py-2">
                        <Loader2
                            size={16}
                            className="animate-spin text-cusblue/40"
                        />
                    </div>
                )}

                {displayMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <p className="text-cusblue font-bold text-sm">
                            {isLoading
                                ? "Fetching history..."
                                : "No messages yet. Say hi! 👋"}
                        </p>
                    </div>
                ) : (
                    displayMessages.map((message) => {
                        const isCurrentUser =
                            (typeof message.senderId === "string"
                                ? message.senderId
                                : message.senderId?._id) === user?._id;

                        return (
                            <div
                                key={message._id}
                                className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                                {!isCurrentUser && (
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1">
                                        {message.senderName}
                                    </span>
                                )}
                                <div
                                    className={`relative max-w-[80%] px-5 py-3 rounded-3xl text-sm shadow-sm transition-all hover:shadow-md ${
                                        isCurrentUser
                                            ? "bg-cusblue text-white rounded-tr-none font-medium"
                                            : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"
                                    }`}>
                                    <p className="leading-relaxed whitespace-pre-wrap wrap-break-word">
                                        {message.text}
                                    </p>
                                </div>
                                <span
                                    className={`text-[9px] font-bold mt-1.5 opacity-50 uppercase tracking-tighter ${isCurrentUser ? "mr-2" : "ml-2"}`}>
                                    {new Date(
                                        message.createdAt,
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messageEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    disabled={!isConnected}
                    placeholder="Share a thought..."
                />
            </div>
        </div>
    );
};

export default ChatContainer;
