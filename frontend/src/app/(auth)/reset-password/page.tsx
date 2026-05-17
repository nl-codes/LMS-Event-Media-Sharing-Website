"use client";
import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import Button from "@/components/buttons/Button";

export default function ForgotPasswordPage() {
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
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col items-center text-center max-w-sm">
                    <AlertCircle className="text-red-500 w-12 h-12 mb-4" />
                    <h2 className="text-red-800 font-bold text-lg">
                        Invalid Link
                    </h2>
                    <p className="text-red-600 text-sm mt-1">
                        The reset token is missing or has expired. Please
                        request a new password reset link.
                    </p>
                    <Button
                        className="mt-6 bg-red-600 hover:bg-red-700 text-white"
                        handleClick={() => router.push("/forgot-password")}>
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl shadow-cusblue/5 border border-cuscream">
                <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-cusblue">
                        Reset Password
                    </h2>
                    <p className="text-gray-500 text-sm mt-2">
                        Enter your new password below to secure your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* New Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-cusblue ml-1">
                            New Password
                        </label>
                        <div className="relative group">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full p-3 bg-cuscream/30 border border-cuscream rounded-xl focus:ring-2 focus:ring-cusblue focus:border-transparent outline-none transition-all pr-12 text-black"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cusblue transition-colors">
                                {showPassword ? (
                                    <EyeOff size={20} />
                                ) : (
                                    <Eye size={20} />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-cusblue ml-1">
                            Confirm New Password
                        </label>
                        <div className="relative group">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full p-3 bg-cuscream/30 border border-cuscream rounded-xl focus:ring-2 focus:ring-cusblue focus:border-transparent outline-none transition-all pr-12 text-black"
                                placeholder="••••••••"
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
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cusblue transition-colors">
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
                        className="w-full py-4 rounded-xl font-bold shadow-lg shadow-cusblue/20 transition-transform active:scale-[0.98]">
                        Save New Password
                    </Button>
                </form>
            </div>
        </div>
    );
}
