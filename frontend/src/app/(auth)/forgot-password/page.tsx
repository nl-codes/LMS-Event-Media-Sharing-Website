"use client";

import LandingButton from "@/components/buttons/LandingButton";
import { FormEvent, useState } from "react";
import { toast } from "react-hot-toast";

export default function Home() {
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
                }
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
        <div className="flex items-center justify-center py-4">
            <form
                onSubmit={handleSubmit}
                className="form p-8 rounded-xl shadow-md">
                <h2 className="text-2xl font-semibold text-cusblue text-center">
                    Forgot Password
                </h2>

                <div className="form-section">
                    <label className="label">Email</label>
                    <input
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <LandingButton
                    type="submit"
                    loading={loading}
                    className="py-3 rounded-xl">
                    Send Reset Link
                </LandingButton>
            </form>
        </div>
    );
}
