"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LandingButton from "@/components/buttons/LandingButton";
import { backend_url } from "@/config/backend";

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        // Null check
        if (!email || !password) {
            toast.error("Both fields are required");
            return;
        }

        try {
            const res = await fetch(`${backend_url}/users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();
            // console.log("Login response:", data);

            if (!res.ok) {
                toast.error(data.error || "Login failed");
                return;
            }

            toast.success("Login successful!");
            setTimeout(() => {
                router.push("/home");
            }, 800);
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        }
    };

    return (
        <div className="form">
            <div className="form-section">
                <span className="form-label">Email</span>
                <input
                    className="form-input"
                    placeholder="johndoe@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="form-section">
                <span className="label">Password</span>
                <input
                    className="form-input"
                    placeholder="*********"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <div className="form-section pt-4">
                <LandingButton
                    handleClick={handleLogin}
                    className="bg-cusblue text-cuscream p-2 rounded-lg font-bold hover:bg-cusviolet hover:cursor-pointer h-12">
                    Login
                </LandingButton>
            </div>
        </div>
    );
}
