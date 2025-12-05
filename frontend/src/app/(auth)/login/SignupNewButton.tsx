"use client";
import { useRouter } from "next/navigation";

export default function SignupNewButton() {
    const router = useRouter();
    const handleSignup = () => router.replace("/signup");
    return (
        <p>
            Don&apos;t have an account?{" "}
            <button
                className="text-blue-600 hover:underline hover:cursor-pointer"
                onClick={handleSignup}>
                Sign up
            </button>
        </p>
    );
}
