"use client";

import { AlertCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import { confirmAlert } from "react-confirm-alert";

export interface OpenConfirmationDialogOptions {
    title: string;
    message: string;
    onConfirm: (reason?: string) => void | Promise<void>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    reasonRequired?: boolean;
    reasonLabel?: string;
    reasonPlaceholder?: string;
}

interface ConfirmDialogContentProps extends OpenConfirmationDialogOptions {
    onClose: () => void;
}

function ConfirmDialogContent({
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDanger = false,
    reasonRequired = false,
    reasonLabel = "Reason",
    reasonPlaceholder = "Write a clear reason...",
    onClose,
}: ConfirmDialogContentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [reason, setReason] = useState("");
    const trimmedReason = reason.trim();

    const handleConfirm = async () => {
        if (isSubmitting) return;
        if (reasonRequired && !trimmedReason) return;

        setIsSubmitting(true);
        try {
            await onConfirm(reasonRequired ? trimmedReason : undefined);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-[420px] transform rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isDanger
                        ? "bg-rose-50 text-rose-500"
                        : "bg-cusblue/5 text-cusblue"
                }`}>
                {isDanger ? (
                    <AlertCircle size={24} />
                ) : (
                    <HelpCircle size={24} />
                )}
            </div>

            <div className="mb-6">
                <h1 className="text-xl font-bold text-cusblue tracking-tight">
                    {title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-cusviolet/70">
                    {message}
                </p>
                {reasonRequired && (
                    <label className="mt-4 block">
                        <span className="text-xs font-black uppercase tracking-widest text-cusviolet/60">
                            {reasonLabel}
                        </span>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={reasonPlaceholder}
                            rows={4}
                            className="mt-2 w-full resize-none rounded-2xl border border-cusblue/10 bg-cusblue/5 px-4 py-3 text-sm font-semibold text-cusblue outline-none transition placeholder:text-cusviolet/40 focus:border-cusviolet/40 focus:ring-4 focus:ring-cusviolet/10"
                        />
                    </label>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={
                        isSubmitting || (reasonRequired && !trimmedReason)
                    }
                    className={`w-full rounded-2xl py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-lg disabled:opacity-75 disabled:cursor-not-allowed ${
                        isDanger
                            ? "bg-rose-500 hover:bg-rose-600 shadow-rose-200"
                            : "bg-cusblue hover:opacity-90 shadow-cusblue/20"
                    }`}>
                    {isSubmitting ? "Please wait..." : confirmText}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        onCancel?.();
                        onClose();
                    }}
                    className="w-full rounded-2xl py-3 text-sm font-semibold text-cusviolet/60 transition-colors hover:bg-slate-50 hover:text-cusblue">
                    {cancelText}
                </button>
            </div>
        </div>
    );
}

export function openConfirmationDialog(options: OpenConfirmationDialogOptions) {
    confirmAlert({
        overlayClassName: "app-confirm-overlay",
        customUI: ({ onClose }) => (
            <ConfirmDialogContent {...options} onClose={onClose} />
        ),
    });
}
