"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/buttons/Button";
import { adminSignup } from "@/lib/adminApi";
import { AlertCircle, Eye, EyeOff, UserPlus } from "lucide-react";
import { emailRegex } from "@/utils/validators";

export default function AdminSignupForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignup = async () => {
        if (isSubmitting) return;
        setErrorMsg("");

        if (!email || !userName || !password || !confirmPassword) {
            setErrorMsg("Please fill in all fields to request admin access.");
            return;
        }

        if (!emailRegex.test(email)) {
            setErrorMsg("Please enter a valid email address.");
            return;
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
        if (!passwordRegex.test(password)) {
            setErrorMsg(
                "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
            );
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("The passwords you entered do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            await adminSignup({ email, userName, password });
            toast.success("Admin request submitted for approval.");
            router.push("/admin/login");
        } catch (error) {
            setErrorMsg((error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form">
            <div className="form-section flex flex-col gap-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Email Address
                </span>
                <input
                    className="form-input w-full p-3 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-cusviolet/20 transition-all placeholder:text-gray-400"
                    placeholder="admin@example.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
            </div>

            <div className="form-section flex flex-col gap-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-cusviolet ml-1">
                    Username
                </span>
                <input
                    className="form-input w-full p-3 rounded-xl border border-cusblue/10 bg-white/50 focus:bg-white focus:ring-2 focus:ring-cusblue/20 outline-cusviolet/20 transition-all placeholder:text-gray-400"
                    placeholder="admin_team"
                    value={userName}
                    onChange={(event) => setUserName(event.target.value)}
                />
            </div>

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
                        onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
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
                        onChange={(event) =>
                            setConfirmPassword(event.target.value)
                        }
                    />
                    <button
                        type="button"
                        onClick={() =>
                            setShowConfirmPassword((value) => !value)
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

            {errorMsg && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="form-section pt-2">
                <Button
                    handleClick={handleSignup}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg shadow-xl shadow-cusblue/10">
                    <UserPlus className="w-5 h-5" />
                    Request Access
                </Button>
            </div>
        </div>
    );
}
