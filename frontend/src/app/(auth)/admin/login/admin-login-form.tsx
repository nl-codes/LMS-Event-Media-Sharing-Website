"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/buttons/Button";
import { useUser } from "@/context/UserContext";
import { adminLogin, getCurrentUser } from "@/lib/adminApi";
import { AlertCircle, Eye, EyeOff, KeyRound, LogIn } from "lucide-react";
import { emailRegex } from "@/utils/validators";

export default function AdminLoginForm() {
    const router = useRouter();
    const { setUser } = useUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [needsOtp, setNeedsOtp] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async () => {
        if (isSubmitting) return;
        setErrorMsg("");

        if (!email || !password) {
            setErrorMsg("Please enter both your email and password.");
            return;
        }

        if (!emailRegex.test(email)) {
            setErrorMsg("Please enter a valid email address.");
            return;
        }

        if (needsOtp && !otp.trim()) {
            setErrorMsg("Please enter the OTP sent to your email.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await adminLogin({
                email,
                password,
                otp: needsOtp ? otp.trim() : undefined,
            });

            if (result.mfaRequired) {
                setNeedsOtp(true);
                toast.success(result.message || "OTP sent to your email.");
                return;
            }

            const currentUser = await getCurrentUser();
            setUser(currentUser);

            if (currentUser.role === "superadmin") {
                toast.success("Welcome, superadmin.");
                router.push("/superadmin/home");
                return;
            }

            if (currentUser.role === "admin") {
                toast.success("Welcome, admin.");
                router.push("/admin/home");
                return;
            }

            setErrorMsg("This account does not have admin access.");
        } catch (error) {
            setErrorMsg((error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form space-y-5">
            <div className="form-section flex flex-col gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Email
                </span>
                <input
                    className="form-input w-full p-3 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-none transition-all placeholder:text-gray-400"
                    placeholder="admin@example.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </div>

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
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
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

            {needsOtp && (
                <div className="form-section flex flex-col gap-2">
                    <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                        One-time password
                    </span>
                    <div className="relative">
                        <input
                            className="form-input w-full p-3 pr-12 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-none transition-all placeholder:text-gray-400"
                            placeholder="6 digit code"
                            inputMode="numeric"
                            value={otp}
                            onChange={(event) => setOtp(event.target.value)}
                        />
                        <KeyRound className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cusblue/40" />
                    </div>
                </div>
            )}

            {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="form-section pt-2">
                <Button
                    handleClick={handleLogin}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg shadow-xl shadow-cusblue/10">
                    <LogIn size={24} />
                    {needsOtp ? "Verify & Sign In" : "Sign In"}
                </Button>
            </div>
        </div>
    );
}
