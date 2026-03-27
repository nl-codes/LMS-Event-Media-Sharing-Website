"use client";
import { useRouter } from "next/navigation";

export default function SignupNewButton() {
    const router = useRouter();
    const handleSignup = () => router.replace("/signup");
    const handleForgotPassword = () => router.push("/forgot-password");
    return (
        <>
            <p>
                Don&apos;t have an account?{" "}
                <button
                    className="text-blue-600 hover:underline hover:cursor-pointer"
                    onClick={handleSignup}>
                    Sign up
                </button>
            </p>
            <p>
                <button
                    className="text-blue-600 hover:underline hover:cursor-pointer"
                    onClick={handleForgotPassword}>
                    Forgot Password?
                </button>
            </p>
        </>
    );
}
