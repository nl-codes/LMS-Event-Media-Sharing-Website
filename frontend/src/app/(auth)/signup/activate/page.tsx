"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type ActivationStatus = "loading" | "success" | "error";

interface ActivationResponse {
    message?: string;
    error?: string;
}

export default function Home() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const token = searchParams.get("token");

    const [status, setStatus] = useState<ActivationStatus>("loading");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            return;
        }

        const activate = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/activate?token=${token}`
                );

                const data: ActivationResponse = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Activation failed");
                }

                setStatus("success");
                setMessage(data.message ?? "Account activated.");

                setTimeout(() => router.push("/login"), 2000);
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error ? err.message : "Activation failed.";

                setStatus("error");
                setMessage(errorMessage);
            }
        };

        activate();
    }, [token, router]);

    return (
        <div className="max-w-sm mx-auto mt-32 text-center font-sans p-4">
            {status === "loading" && (
                <>
                    <h2 className="text-xl font-semibold">
                        Activating your account...
                    </h2>
                    <p className="text-gray-600 mt-2">Please wait a moment.</p>
                </>
            )}

            {status === "success" && (
                <>
                    <h2 className="text-xl font-semibold text-green-600">
                        Account Activated 🎉
                    </h2>
                    <p className="mt-2">{message}</p>
                    <p className="text-gray-600 mt-2">
                        Redirecting to login...
                    </p>
                </>
            )}

            {status === "error" && (
                <>
                    <h2 className="text-xl font-semibold text-red-600">
                        Activation Failed ❌
                    </h2>
                    <p className="mt-2">{message}</p>

                    <button
                        onClick={() => router.push("/signup/reactivate")}
                        className="mt-5 bg-green-600 text-white px-6 py-2 rounded-lg shadow hover:bg-green-700">
                        Resend Activation Link
                    </button>
                </>
            )}
        </div>
    );
}
