"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/buttons/Button";
import { backend_url } from "@/config/backend";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { showPopUp } from "@/utils/Popup";

export default function SignupForm() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSignup = async () => {
        if (isSubmitting) return;

        // Validations
        if (!email || !userName || !password || !confirmPassword) {
            toast.error("All fields are required");
            return;
        }

        // Email Vvalidation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        // Passwords match
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
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
                toast.error(data.error || "Signup failed");
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
            toast.error("Something went wrong");
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-section flex flex-col gap-1.5 relative">
                    <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                        Password
                    </span>
                    <div className="relative">
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
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-cusblue/40 hover:text-cusblue transition-colors p-1"
                            tabIndex={-1}>
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </div>
                <div className="form-section flex flex-col gap-1.5 relative">
                    <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                        Confirm
                    </span>
                    <div className="relative">
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
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-cusblue/40 hover:text-cusblue transition-colors p-1"
                            tabIndex={-1}>
                            {showConfirmPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Submit Button */}
            <div className="form-section pt-6">
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
