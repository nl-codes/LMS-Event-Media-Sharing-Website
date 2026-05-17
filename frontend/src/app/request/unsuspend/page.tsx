"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ShieldAlert } from "lucide-react";
import { submitUnsuspendAppeal } from "@/lib/reportApi";

export default function UnsuspendAppealPage() {
    const [email, setEmail] = useState("");
    const [appealMessage, setAppealMessage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !appealMessage.trim()) {
            toast.error("Email and appeal message are required");
            return;
        }
        try {
            setSubmitting(true);
            await submitUnsuspendAppeal({
                email: email.trim(),
                appealMessage: appealMessage.trim(),
            });
            setSubmitted(true);
            toast.success("Appeal submitted");
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to submit appeal",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-cuscream px-4 py-10 text-cusblue">
            <div className="mx-auto max-w-xl">
                <div className="overflow-hidden rounded-3xl bg-white shadow-2xl">
                    <div className="bg-linear-to-r from-rose-500 to-red-600 px-6 py-8 text-white">
                        <div className="flex items-center gap-3">
                            <ShieldAlert className="h-7 w-7" />
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                    Account suspended
                                </p>
                                <h1 className="text-2xl font-black">
                                    File an Appeal
                                </h1>
                            </div>
                        </div>
                        <p className="mt-4 text-sm leading-relaxed opacity-95">
                            If you believe your account was suspended in error,
                            you may file an appeal here. Our team will review
                            and get back to you.
                        </p>
                    </div>

                    {submitted ? (
                        <div className="space-y-4 p-6 text-center">
                            <p className="text-lg font-extrabold text-cusblue">
                                Appeal received
                            </p>
                            <p className="text-sm text-slate-600">
                                Thank you. An admin will review your appeal and
                                you will hear back via email.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block rounded-2xl bg-linear-to-r from-cusblue to-cusviolet px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:scale-[1.02]">
                                Back to login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4 p-6">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-cusviolet">
                                    Account email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full rounded-2xl border border-cusblue/15 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cusviolet focus:ring-4 focus:ring-cusviolet/10"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-cusviolet">
                                    Your appeal
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    value={appealMessage}
                                    onChange={(e) =>
                                        setAppealMessage(e.target.value)
                                    }
                                    placeholder="Explain why you believe the suspension should be lifted..."
                                    className="w-full resize-none rounded-2xl border border-cusblue/15 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cusviolet focus:ring-4 focus:ring-cusviolet/10"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full rounded-2xl bg-linear-to-r from-cusblue to-cusviolet px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60">
                                {submitting ? "Submitting..." : "Submit appeal"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}
