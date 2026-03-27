"use client";

import React, { useState, useCallback } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
    onSendMessage: (text: string) => void;
    disabled?: boolean;
    placeholder?: string;
    value?: string;
    onChange?: (value: string) => void;
}

/**
 * MessageInput Component
 * Provides input field and send button for chat messages
 */
const MessageInput: React.FC<MessageInputProps> = ({
    onSendMessage,
    disabled = false,
    placeholder = "Type a message...",
    value = "",
    onChange,
}) => {
    const [localValue, setLocalValue] = useState("");
    const displayValue = value !== undefined ? value : localValue;

    /**
     * Handle text input change
     */
    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const newValue = e.target.value;
            if (onChange) {
                onChange(newValue);
            } else {
                setLocalValue(newValue);
            }
        },
        [onChange],
    );

    /**
     * Handle send button click
     */
    const handleSend = useCallback(async () => {
        if (!displayValue.trim() || disabled) return;

        try {
            onSendMessage(displayValue);
            // Clear input
            if (onChange) {
                onChange("");
            } else {
                setLocalValue("");
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    }, [displayValue, disabled, onSendMessage, onChange]);

    /**
     * Handle Enter key to send message
     * Shift+Enter for new line
     */
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    const isLoading = disabled;
    const canSend = displayValue.trim() && !isLoading;

    return (
        <div className="flex gap-2 items-end">
            <textarea
                value={displayValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={2}
                className={`flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 text-sm resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all ${
                    disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
            />
            <button
                onClick={handleSend}
                disabled={!canSend}
                className={`p-2 rounded-lg transition-all duration-200 flex items-center justify-center ${
                    canSend
                        ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        : "bg-slate-700 text-slate-400 cursor-not-allowed"
                }`}
                title="Send message (Shift+Enter for new line)">
                <Send size={18} />
            </button>
        </div>
    );
};

export default MessageInput;
