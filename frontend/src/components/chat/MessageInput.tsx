"use client";

import React, { useState, useCallback } from "react";
import { Send, Sparkles } from "lucide-react";

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    disabled = false,
    placeholder = "Type a message...",
}) => {
    const [value, setValue] = useState("");

    const handleSend = useCallback(() => {
        if (!value.trim() || disabled) return;
        onSendMessage(value);
        setValue("");
    }, [value, disabled, onSendMessage]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const canSend = value.trim() && !disabled;

    return (
        <div className="relative flex items-center gap-3 bg-white p-2 rounded-4xl border border-slate-200 shadow-inner group focus-within:border-cusblue/30 transition-all">
            <div className="pl-3 text-cusblue/30 group-focus-within:text-cusblue transition-colors">
                <Sparkles size={18} />
            </div>
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className="flex-1 bg-transparent py-2 text-slate-700 placeholder-slate-400 text-sm resize-none focus:outline-none scrollbar-hide min-h-10 max-h-[120px]"
            />
            <button
                onClick={handleSend}
                disabled={!canSend}
                className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    canSend
                        ? "bg-cusblue text-white shadow-lg shadow-cusblue/30 scale-100 hover:scale-110 active:scale-90"
                        : "bg-slate-100 text-slate-300 scale-90"
                }`}>
                <Send
                    size={16}
                    strokeWidth={2.5}
                    className={
                        canSend ? "translate-x-0.5 -translate-y-0.5" : ""
                    }
                />
            </button>
        </div>
    );
};

export default MessageInput;
