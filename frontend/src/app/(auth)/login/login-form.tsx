"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Button from "@/components/buttons/Button";
import { backend_url } from "@/config/backend";
import { useUser } from "@/context/UserContext";
import { LogIn, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { setUser } = useUser();

    const handleLogin = async () => {
        if (isSubmitting) return;

        if (!email || !password) {
            toast.error("Both fields are required");
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
                toast.error(data.error || "Login failed");
                setIsSubmitting(false);
                return;
            }

            const meRes = await fetch(`${backend_url}/users/me`, {
                credentials: "include",
            });

            if (!meRes.ok) {
                toast.error("Session Expired. Login Again");
                setIsSubmitting(false);
                return;
            }

            const user = await meRes.json();
            setUser(user);
            toast.success("Login successful!");
            router.push("/home");
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
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
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Sign In Button */}
            <div className="form-section pt-4">
                <Button
                    handleClick={handleLogin}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full h-14 text-lg shadow-xl shadow-cusblue/10">
                    <LogIn className="w-5 h-5" />
                    Sign In
                </Button>
            </div>
        </div>
    );
}
