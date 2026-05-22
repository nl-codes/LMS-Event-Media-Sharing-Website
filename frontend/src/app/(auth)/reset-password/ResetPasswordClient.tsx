"use client";

import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
    AlertCircle,
    Check,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    ShieldCheck,
} from "lucide-react";
import Button from "@/components/buttons/Button";

export default function ResetPasswordClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.error("All fields are required");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/reset-password?token=${token}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password }),
                },
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reset failed");

            toast.success("Password reset successful. Please log in.");
            router.push("/login");
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
            else toast.error("Unexpected error");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center bg-cuscream/30 px-6 py-20">
                <div className="w-full max-w-md rounded-4xl border border-red-100 bg-white/70 p-8 text-center shadow-2xl shadow-red-100/60 backdrop-blur-md">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                        <AlertCircle className="h-9 w-9" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400">
                        Reset unavailable
                    </p>
                    <h1 className="mt-3 text-2xl font-black text-red-800">
                        Invalid reset link
                    </h1>
                    <p className="mt-3 text-sm font-medium leading-6 text-red-600">
                        The reset token is missing or has expired. Please
                        request a new password reset link.
                    </p>
                    <Button
                        className="mt-6 bg-red-600 text-white hover:bg-red-700"
                        handleClick={() => router.push("/forgot-password")}>
                        Request New Link
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="flex items-center justify-center bg-cuscream/30 px-6 py-20">
            <div className="flex w-full max-w-6xl flex-col items-start justify-center gap-16 lg:flex-row lg:gap-24">
                <div className="flex w-full flex-col gap-6 lg:w-[410px]">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cusblue/10 bg-white/60 px-4 py-1.5 text-sm font-medium text-cusblue shadow-sm backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cusblue opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cusblue" />
                        </span>
                        Secure Reset Portal
                    </div>

                    <h1 className="text-5xl font-extrabold tracking-tight text-cusblue">
                        Create a new password
                    </h1>

                    <p className="text-xl font-medium leading-relaxed text-cusviolet/80">
                        Choose a fresh password to protect your LMS 24 account
                        and return to your event spaces securely.
                    </p>

                    <div className="mt-4 flex flex-col gap-4 border-t border-cusblue/5 pt-8 sm:flex-row">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cusblue/10">
                                <ShieldCheck className="h-4 w-4 text-cusblue" />
                            </div>
                            <span>Encrypted recovery</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cusviolet/10">
                                <Check className="h-4 w-4 text-cusviolet" />
                            </div>
                            <span>Instant sign in after reset</span>
                        </div>
                    </div>
                </div>

                <div className="w-full rounded-[2.5rem] border border-white bg-white/40 p-8 shadow-2xl shadow-cusblue/5 backdrop-blur-md lg:w-[470px] lg:p-10">
                    <div className="mb-8">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cusblue/10 text-cusblue">
                            <KeyRound className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-black text-cusblue">
                            Reset password
                        </h2>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                            Use a strong password that you have not used before.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="ml-1 text-sm font-bold text-cusblue">
                                New Password
                            </label>
                            <div className="group relative">
                                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cusviolet/50" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full rounded-2xl border border-cusblue/10 bg-white/70 p-4 pl-11 pr-12 text-black outline-none transition-all placeholder:text-slate-300 focus:border-cusblue focus:ring-4 focus:ring-cusblue/10"
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-cusblue"
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }>
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="ml-1 text-sm font-bold text-cusblue">
                                Confirm New Password
                            </label>
                            <div className="group relative">
                                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cusviolet/50" />
                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    className="w-full rounded-2xl border border-cusblue/10 bg-white/70 p-4 pl-11 pr-12 text-black outline-none transition-all placeholder:text-slate-300 focus:border-cusblue focus:ring-4 focus:ring-cusblue/10"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((v) => !v)
                                    }
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-cusblue"
                                    aria-label={
                                        showConfirmPassword
                                            ? "Hide confirmation password"
                                            : "Show confirmation password"
                                    }>
                                    {showConfirmPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            loading={loading}
                            className="w-full rounded-2xl py-4 font-bold shadow-lg shadow-cusblue/20 transition-transform active:scale-[0.98]">
                            Save New Password
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}
