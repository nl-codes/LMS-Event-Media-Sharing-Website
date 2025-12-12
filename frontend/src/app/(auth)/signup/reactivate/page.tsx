"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setStatus("loading");

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/resend-activation`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to resend link");
            }

            setStatus("success");
            setMessage(data.message);
        } catch (err: unknown) {
            setStatus("error");
            setMessage(
                err instanceof Error ? err.message : "Something went wrong."
            );
        }
    };

    return (
        <div className="max-w-sm mx-auto mt-32 font-sans p-4 text-center">
            <h2 className="text-xl font-semibold">Resend Activation Link</h2>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="border p-2 rounded"
                />

                <button
                    type="submit"
                    className="bg-green-600 text-white py-2 rounded hover:bg-green-700">
                    Send Link
                </button>
            </form>

            {status === "loading" && (
                <p className="mt-4 text-gray-600">Sending...</p>
            )}

            {status === "success" && (
                <p className="mt-4 text-green-600">{message}</p>
            )}

            {status === "error" && (
                <p className="mt-4 text-red-600">{message}</p>
            )}
        </div>
    );
}
