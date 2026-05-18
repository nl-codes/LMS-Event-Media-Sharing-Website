"use client";

import { AlertTriangle, X } from "lucide-react";

type Props = {
    reasoning: string;
    onReasoningChange: (value: string) => void;
    action: string;
    actionDescription: string;
    submitting: boolean;
    onVerify: () => void;
    onDismiss: () => void;
};

export default function VerificationForm({
    reasoning,
    onReasoningChange,
    action,
    actionDescription,
    submitting,
    onVerify,
    onDismiss,
}: Props) {
    return (
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
            <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-cusviolet/70">
                Verification
            </h2>
            <div className="space-y-4">
                <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-cusviolet">
                        Reasoning (required)
                    </label>
                    <textarea
                        value={reasoning}
                        onChange={(e) => onReasoningChange(e.target.value)}
                        rows={4}
                        placeholder="Explain your decision in detail. This will be visible to the reporter and the affected user."
                        className="w-full resize-none rounded-2xl border border-cusblue/15 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cusviolet focus:ring-4 focus:ring-cusviolet/10"
                    />
                </div>

                <div className="rounded-2xl border border-cusblue/10 bg-cuscream/40 p-4 text-sm">
                    <p className="font-extrabold text-cusblue">
                        Verifying will take action:{" "}
                        <span className="text-rose-600">{action}</span>
                    </p>
                    <p className="mt-1 text-slate-600">{actionDescription}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={onVerify}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
                        <AlertTriangle className="h-4 w-4" />
                        Verify & take action
                    </button>
                    <button
                        type="button"
                        onClick={onDismiss}
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-2xl border border-cusblue/20 bg-white px-5 py-3 text-sm font-extrabold text-cusblue transition hover:bg-cuscream disabled:opacity-60">
                        <X className="h-4 w-4" />
                        Dismiss
                    </button>
                </div>
            </div>
        </section>
    );
}
