"use client";

import { Loader2 } from "lucide-react";

type GuestJoinModalProps = {
    open: boolean;
    value: string;
    loading: boolean;
    onClose: () => void;
    onChange: (value: string) => void;
    onSubmit: () => void;
};

export default function GuestJoinModal({
    open,
    value,
    loading,
    onClose,
    onChange,
    onSubmit,
}: GuestJoinModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-cusblue mb-2">
                    Continue as guest
                </h3>
                <p className="text-sm text-cusviolet/80 mb-4">
                    Enter a display name for your uploads.
                </p>

                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-cusblue/20 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-cusblue/40"
                    maxLength={32}
                />

                <div className="mt-4 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl border border-cusblue/20 text-cusblue hover:bg-cusblue/5 disabled:opacity-50">
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={loading || !value.trim()}
                        className="px-4 py-2 rounded-xl bg-cusblue text-cuscream hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            "Continue"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
