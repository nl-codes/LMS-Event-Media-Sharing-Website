"use client";

import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";
import { Check, Mail, RotateCcw, ShieldCheck } from "lucide-react";
import BackButton from "@/components/buttons/BackButton";
import Button from "@/components/buttons/Button";

export default function ForgotPasswordClient() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email) {
            toast.error("Email is required");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/forgot-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                },
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");

            toast.success("Password reset link sent to your email");
            setEmail("");
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
            else toast.error("Unexpected error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex items-center justify-center bg-cuscream/30 px-6 py-20">
            <div className="flex w-full max-w-6xl flex-col items-start justify-center gap-16 lg:flex-row lg:gap-24">
                <div className="flex w-full flex-col gap-6 lg:w-[410px]">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cusblue/10 bg-white/60 px-4 py-1.5 text-sm font-medium text-cusblue shadow-sm backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cusviolet opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cusviolet" />
                        </span>
                        Account Recovery
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight text-cusblue">
                        Recover your password
                    </h1>

                    <p className="text-xl font-medium leading-relaxed text-cusviolet/80">
                        Enter your account email and we will send a secure reset
                        link so you can get back to your event memories.
                    </p>

                    <div className="mt-4 flex flex-col gap-4 border-t border-cusblue/5 pt-8 sm:flex-row">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cusblue/10">
                                <ShieldCheck className="h-4 w-4 text-cusblue" />
                            </div>
                            <span>Secure email reset</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cusviolet/10">
                                <Check className="h-4 w-4 text-cusviolet" />
                            </div>
                            <span>No account changes until confirmed</span>
                        </div>
                    </div>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="w-full rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-cusblue/5 backdrop-blur-md lg:w-[470px] lg:p-10">
                    <div className="mb-8 flex flex-row items-center gap-4">
                        <BackButton href="/login" label="Back to login" />
                    </div>

                    <div className="mb-8">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cusblue/10 text-cusblue">
                            <RotateCcw className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-black text-cusblue">
                            Forgot password?
                        </h2>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                            We will email you a link to create a new password if
                            the address matches an LMS 24 account.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="ml-1 text-sm font-bold text-cusblue">
                            Email address
                        </label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cusviolet/50" />
                            <input
                                type="email"
                                className="w-full rounded-2xl border border-cusblue/10 bg-white/70 p-4 pl-11 text-black outline-none transition-all placeholder:text-slate-300 focus:border-cusblue focus:ring-4 focus:ring-cusblue/10"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        loading={loading}
                        className="mt-6 w-full rounded-2xl py-4 font-bold shadow-lg shadow-cusblue/20 transition-transform active:scale-[0.98]">
                        Send Reset Link
                    </Button>
                </form>
            </div>
        </main>
    );
}
