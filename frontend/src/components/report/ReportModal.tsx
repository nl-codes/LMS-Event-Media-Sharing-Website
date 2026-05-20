"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { createReport } from "@/lib/reportApi";
import { type ReportTargetType } from "@/types/Report";

const REASONS = [
    "Spam or misleading",
    "Harassment or hate speech",
    "Inappropriate or explicit content",
    "Violence or dangerous behavior",
    "Intellectual property violation",
    "Other",
];

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetId: string;
    targetType: ReportTargetType;
    targetLabel?: string;
}

export default function ReportModal({
    isOpen,
    onClose,
    targetId,
    targetType,
    targetLabel,
}: ReportModalProps) {
    const [reason, setReason] = useState(REASONS[0]);
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setReason(REASONS[0]);
            setDescription("");
        }
    }, [isOpen]);

    if (!isOpen || typeof document === "undefined") return null;

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please choose a reason");
            return;
        }
        try {
            setSubmitting(true);
            await createReport({
                targetId,
                targetType,
                reason: reason.trim(),
                description: description.trim(),
            });
            toast.success("Report submitted. Thank you.");
            onClose();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to submit report",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
            onClick={onClose}
            role="presentation">
            <div
                className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true">
                <div className="flex items-center justify-between bg-linear-to-r from-rose-500 to-red-600 px-5 py-4 text-white">
                    <h2 className="text-lg font-black">
                        Report {targetType}
                        {targetLabel ? `: ${targetLabel}` : ""}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 transition hover:bg-white/15"
                        aria-label="Close report dialog">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4 p-5">
                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-cusviolet">
                            Reason
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-2xl border border-cusblue/15 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-cusviolet focus:ring-4 focus:ring-cusviolet/10">
                            {REASONS.map((r) => (
                                <option key={r} value={r}>
                                    {r}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-cusviolet">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            maxLength={1000}
                            placeholder="Tell us more about why you're reporting this..."
                            className="w-full resize-none rounded-2xl border border-cusblue/15 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cusviolet focus:ring-4 focus:ring-cusviolet/10"
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-2xl border border-cusblue/20 bg-white px-4 py-2 text-sm font-bold text-cusblue transition hover:bg-cuscream disabled:opacity-60">
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="rounded-2xl bg-rose-500 px-5 py-2 text-sm font-extrabold text-white shadow-md transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
                            {submitting ? "Submitting..." : "Submit report"}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
