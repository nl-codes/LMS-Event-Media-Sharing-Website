"use client";
import { useRouter } from "next/navigation";

export default function LoginOptions() {
    const router = useRouter();
    const handleLogin = () => router.replace("/login");
    return (
        <p>
            Already have an account?{" "}
            <button
                className="text-blue-600 hover:underline hover:cursor-pointer"
                onClick={handleLogin}>
                Log in
            </button>
        </p>
    );
}
