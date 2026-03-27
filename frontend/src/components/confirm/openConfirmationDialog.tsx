"use client";

import { AlertCircle, HelpCircle } from "lucide-react";
import { useState } from "react";
import { confirmAlert } from "react-confirm-alert";

export interface OpenConfirmationDialogOptions {
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
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
    onClose,
}: ConfirmDialogContentProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onConfirm();
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-[360px] transform rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isDanger
                        ? "bg-rose-50 text-rose-500"
                        : "bg-cusblue/5 text-cusblue"
                }`}>
                {isDanger ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
            </div>

            <div className="mb-6">
                <h1 className="text-xl font-bold text-cusblue tracking-tight">
                    {title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-cusviolet/70">
                    {message}
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isSubmitting}
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
