"use client";

import { useState } from "react";
import { ShieldAlert, Send } from "lucide-react";
import toast from "react-hot-toast";
import { submitEventAppeal } from "@/lib/reportApi";
import type { Event } from "@/types/Event";

type EventAppealPanelProps = {
    event: Event;
};

export default function EventAppealPanel({ event }: EventAppealPanelProps) {
    const [appealMessage, setAppealMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        const message = appealMessage.trim();
        if (!message) {
            toast.error("Appeal message is required");
            return;
        }

        setSubmitting(true);
        try {
            await submitEventAppeal(event._id, { appealMessage: message });
            setSubmitted(true);
            toast.success("Event appeal submitted");
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to submit event appeal",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="rounded-3xl border border-rose-100 bg-rose-50/80 p-5 shadow-xl shadow-rose-100/40">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                        <ShieldAlert className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-rose-500/75">
                            Event suspended
                        </p>
                        <h2 className="text-xl font-black text-cusblue">
                            Appeal this decision
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-rose-700/80">
                            {event.adminActionReason
                                ? `Reason: ${event.adminActionReason}`
                                : "This event has been suspended by admin review."}
                        </p>
                    </div>
                </div>
            </div>

            {submitted ? (
                <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                    Your appeal has been submitted. Admins will review it from
                    the appeal queue.
                </div>
            ) : (
                <div className="mt-5 space-y-3">
                    <textarea
                        value={appealMessage}
                        onChange={(e) => setAppealMessage(e.target.value)}
                        rows={4}
                        placeholder="Explain why this event should be restored."
                        className="w-full resize-none rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-sm font-semibold text-cusblue outline-none transition placeholder:text-cusviolet/40 focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
                    />
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || !appealMessage.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-rose-200 transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
                        <Send className="h-4 w-4" />
                        {submitting ? "Submitting..." : "Submit Appeal"}
                    </button>
                </div>
            )}
        </section>
    );
}
