"use client";
import { useRouter } from "next/navigation";

export default function LoginExistingButton() {
    const router = useRouter();
    const handleLogin = () => router.replace("/login");
    return (
        <p>
            Already have an account?{" "}
            <button
                className="text-cusblue hover:underline hover:cursor-pointer"
                onClick={handleLogin}>
                Log in
            </button>
        </p>
    );
}
