"use client";

import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import LandingButton from "@/components/buttons/LandingButton";

export default function Home() {
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
                }
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
            <div className="min-h-screen flex items-center justify-center text-cusblue">
                Invalid or missing reset token
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center py-4">
            <form
                onSubmit={handleSubmit}
                className="form p-8 rounded-xl shadow-md">
                <h2 className="text-2xl font-semibold text-cusblue text-center">
                    Reset Password
                </h2>

                {/* New Password */}
                <div className="form-section relative">
                    <label className="label">New Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-input pr-12"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-cusblue scale-200">
                            {showPassword ? "👁👁" : "🙈"}
                        </button>
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="form-section relative">
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            className="form-input pr-12"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute right-6 top-1/2 -translate-y-1/2 text-cusblue scale-200">
                            {showConfirmPassword ? "👁👁" : "🙈"}
                        </button>
                    </div>
                </div>

                <LandingButton
                    type="submit"
                    loading={loading}
                    className="py-3 rounded-xl">
                    Reset Password
                </LandingButton>
            </form>
        </div>
    );
}
