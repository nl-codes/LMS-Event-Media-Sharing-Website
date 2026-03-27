"use client";

import React, { useMemo, useRef, useState } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import MessageInput from "@/components/chat/MessageInput";
import { useUser } from "@/context/UserContext";
import {
    MessageSquare,
    X,
    Circle,
    ChevronDown,
    Maximize2,
    Minimize2,
} from "lucide-react";

interface ChatContainerProps {
    eventId: string;
    eventName: string;
}

type ViewMode = "minimized" | "window" | "full";

export const ChatContainer: React.FC<ChatContainerProps> = ({
    eventId,
    eventName,
}) => {
    const { user } = useUser();
    const [viewMode, setViewMode] = useState<ViewMode>("minimized");
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);

    const {
        messages,
        isConnected,
        isLoading,
        isLoadingOlder,
        hasMore,
        sendMessage,
        loadOlderMessages,
        clearError,
        messageEndRef,
    } = useChatSocket({
        eventId,
        userId: user?._id || "",
        enabled: !!user?._id,
    });

    const displayMessages = useMemo(() => {
        return [...messages].sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
        );
    }, [messages]);

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

    const handleMessagesScroll = async (
        event: React.UIEvent<HTMLDivElement>,
    ) => {
        if (!hasMore || isLoadingOlder || isLoading) {
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

    if (!user?._id) return null;

    const containerClasses = {
        minimized:
            "w-0 h-0 opacity-0 pointer-events-none scale-90 translate-y-10",
        window: "w-[380px] sm:w-[420px] h-[580px] opacity-100 scale-100 translate-y-0 bottom-24 right-6 rounded-[2.5rem]",
        full: "fixed inset-0 w-full h-full z-[100] bg-white opacity-100 scale-100 sm:inset-4 sm:w-[calc(100%-2rem)] sm:h-[calc(100%-2rem)] sm:rounded-[3rem]",
    };

    return (
        <>
            {/* FULL SCREEN OVERLAY BACKGROUND */}
            {viewMode === "full" && (
                <div className="fixed inset-0 z-90 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-300" />
            )}

            <div
                className={`
                fixed z-100 flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                bg-white border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]
                ${containerClasses[viewMode]}
            `}>
                {/* Header */}
                <div
                    className={`px-6 py-5 border-b border-slate-50 flex items-center justify-between ${viewMode === "full" ? "bg-white" : "bg-slate-50/50"}`}>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-linear-to-br from-cusblue to-cusviolet flex items-center justify-center text-white shadow-lg">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="text-cusblue font-black text-sm uppercase tracking-tight">
                                Live Chat
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() =>
                                setViewMode(
                                    viewMode === "full" ? "window" : "full",
                                )
                            }
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors hidden sm:block">
                            {viewMode === "full" ? (
                                <Minimize2 size={18} />
                            ) : (
                                <Maximize2 size={18} />
                            )}
                        </button>
                        <button
                            onClick={() => setViewMode("minimized")}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                            {viewMode === "full" ? (
                                <X size={20} />
                            ) : (
                                <ChevronDown size={20} />
                            )}
                        </button>
                    </div>
                </div>

                {/* Messages Feed */}
                <div
                    ref={messagesContainerRef}
                    onScroll={handleMessagesScroll}
                    className={`flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth ${viewMode === "full" ? "max-w-4xl mx-auto w-full" : ""}`}>
                    {isLoadingOlder && (
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                            Loading older messages...
                        </div>
                    )}
                    {isLoading && displayMessages.length === 0 && (
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                            Loading chat history...
                        </div>
                    )}
                    {displayMessages.map((message) => {
                        const isMe =
                            (typeof message.senderId === "string"
                                ? message.senderId
                                : message.senderId?._id) === user?._id;
                        return (
                            <div
                                key={message._id}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                {!isMe && (
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1.5">
                                        {message.senderName}
                                    </span>
                                )}
                                <div
                                    className={`px-5 py-3 rounded-3xl text-[13px] shadow-sm ${isMe ? "bg-cusblue text-white rounded-tr-none" : "bg-white border border-slate-100 text-slate-700 rounded-tl-none"}`}>
                                    <p className="leading-relaxed whitespace-pre-wrap wrap-break-word">
                                        {message.text}
                                    </p>
                                </div>
                                <span className="text-[9px] font-bold mt-1.5 opacity-40 uppercase">
                                    {new Date(
                                        message.createdAt,
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={messageEndRef} />
                </div>

                {/* Footer/Input */}
                <div
                    className={`p-4 bg-white border-t border-slate-50 ${viewMode === "full" ? "pb-8 sm:pb-4" : ""}`}>
                    <div
                        className={
                            viewMode === "full"
                                ? "max-w-4xl mx-auto w-full"
                                : ""
                        }>
                        <MessageInput
                            onSendMessage={handleSendMessage}
                            disabled={false}
                        />
                    </div>
                </div>
            </div>

            {/* --- FLOATING TRIGGER BUTTON --- */}
            {viewMode !== "full" && (
                <div className="fixed bottom-6 right-6 z-110">
                    <button
                        onClick={() =>
                            setViewMode(
                                viewMode === "minimized"
                                    ? "window"
                                    : "minimized",
                            )
                        }
                        className={`group relative h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 active:scale-90
                            ${viewMode === "minimized" ? "bg-cusblue text-white" : "bg-white text-cusblue border border-slate-100 rotate-90"}
                        `}>
                        {viewMode === "minimized" ? (
                            <MessageSquare
                                size={28}
                                className="group-hover:scale-110"
                            />
                        ) : (
                            <X size={28} />
                        )}
                    </button>
                </div>
            )}
        </>
    );
};

export default ChatContainer;
