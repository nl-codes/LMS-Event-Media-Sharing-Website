"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/buttons/Button";
import { backend_url } from "@/config/backend";
import { Eye, EyeOff, UserPlus, AlertCircle } from "lucide-react";
import { showPopUp } from "@/utils/Popup";

export default function SignupForm() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSignup = async () => {
        if (isSubmitting) return;
        setErrorMsg("");
        // Validations
        if (!email || !userName || !password || !confirmPassword) {
            setErrorMsg("Please fill in all fields to create your account.");
            return;
        }

        // Email Validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setErrorMsg(
                "Please enter a valid email address (e.g., abc@example.com).",
            );
            return;
        }

        // Password Validation
        // Requirement: 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Symbol
        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            setErrorMsg(
                "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
            );
            return;
        }

        // Confirm Password Match
        if (password !== confirmPassword) {
            setErrorMsg(
                "The passwords you entered do not match. Please try again.",
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`${backend_url}/users/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, userName, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Signup failed. Please try again.");
                setIsSubmitting(false);
                return;
            }

            // Successful Signup
            toast.success("Account created successfully!");

            // Show pop up for activation email
            showPopUp({
                title: "Check Your Email",
                message: `We've sent an activation link to ${email}. Please verify your account to continue.`,
                confirmLabel: "Go to Login",
                onConfirm: () => router.push("/login"),
            });
        } catch (err) {
            console.error(err);
            setErrorMsg(
                "Something went wrong on our end. Please try again later.",
            );
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form space-y-4">
            {/* Email Field */}
            <div className="form-section flex flex-col gap-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Email Address
                </span>
                <input
                    className="form-input w-full p-3 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-cusviolet/20 transition-all placeholder:text-gray-400"
                    placeholder="johndoe@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            {/* Username Field */}
            <div className="form-section flex flex-col gap-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Username
                </span>
                <input
                    className="form-input w-full p-3 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-cusviolet/20 transition-all placeholder:text-gray-400"
                    placeholder="johndoe_25"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                />
            </div>

            {/* Password Field */}
            <div className="form-section flex flex-col gap-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Password
                </span>
                <div className="relative group">
                    <input
                        className="form-input w-full p-3 pr-12 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-cusviolet/20 transition-all placeholder:text-gray-400"
                        placeholder="*********"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cusblue/60 hover:text-cusviolet transition-colors p-1.5 rounded-lg hover:bg-cusviolet/5"
                        tabIndex={-1}>
                        {showPassword ? (
                            <EyeOff size={24} />
                        ) : (
                            <Eye size={24} />
                        )}
                    </button>
                </div>
            </div>

            {/* Confirm Password Field */}
            <div className="form-section flex flex-col gap-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Confirm Password
                </span>
                <div className="relative group">
                    <input
                        className="form-input w-full p-3 pr-12 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-cusviolet/20 transition-all placeholder:text-gray-400"
                        placeholder="*********"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-cusblue/60 hover:text-cusviolet transition-colors p-1.5 rounded-lg hover:bg-cusviolet/5"
                        tabIndex={-1}>
                        {showConfirmPassword ? (
                            <EyeOff size={24} />
                        ) : (
                            <Eye size={24} />
                        )}
                    </button>
                </div>
            </div>

            {/* Error Message Display */}
            {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Submit Button */}
            <div className="form-section pt-2">
                <Button
                    handleClick={handleSignup}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg shadow-xl shadow-cusblue/10">
                    <UserPlus className="w-5 h-5" />
                    Create Account
                </Button>
            </div>
        </div>
    );
}
