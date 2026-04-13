"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/buttons/Button";
import { backend_url } from "@/config/backend";
import { useUser } from "@/context/UserContext";
import { LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { emailRegex } from "@/utils/validators";

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { setUser } = useUser();

    const handleLogin = async () => {
        if (isSubmitting) return;
        setErrorMsg("");

        // Empty Field Validation
        if (!email || !password) {
            setErrorMsg("Please enter both your email and password.");
            return;
        }

        // 2. Email Format Validation
        if (!emailRegex.test(email)) {
            setErrorMsg("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await fetch(`${backend_url}/users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.error || "Invalid email or password.");
                setIsSubmitting(false);
                return;
            }

            const meRes = await fetch(`${backend_url}/users/me`, {
                credentials: "include",
            });

            if (!meRes.ok) {
                setErrorMsg("Session Expired. Please login again.");
                setIsSubmitting(false);
                return;
            }

            const user = await meRes.json();
            setUser(user);
            toast.success("Welcome back! 🙂");
            router.push("/home");
        } catch (err) {
            console.error(err);
            setErrorMsg("Something went wrong. Please try again later.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form space-y-5">
            {/* Email Field */}
            <div className="form-section flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Email
                </span>
                <input
                    className="form-input w-full p-3 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-none transition-all placeholder:text-gray-400"
                    placeholder="johndoe@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            {/* Password Field */}
            <div className="form-section flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Password
                </span>
                <div className="relative group">
                    <input
                        className="form-input w-full p-3 pr-12 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-none transition-all placeholder:text-gray-400"
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

            {/* Sign In Button */}
            <div className="form-section pt-2">
                <Button
                    handleClick={handleLogin}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg shadow-xl shadow-cusblue/10">
                    <LogIn size={24} />
                    Sign In
                </Button>
            </div>
        </div>
    );
}
