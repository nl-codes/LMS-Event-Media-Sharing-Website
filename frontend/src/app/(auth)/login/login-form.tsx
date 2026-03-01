"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LandingButton from "@/components/buttons/LandingButton";
import { backend_url } from "@/config/backend";
import { useUser } from "@/context/UserContext";

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { setUser } = useUser();

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
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Login failed");
                return;
            }

            // Fetch user info from the protected /me endpoint
            // (the login response set the httpOnly cookie)
            const meRes = await fetch(`${backend_url}/users/me`, {
                credentials: "include",
            });

            if (!meRes.ok) {
                toast.error("Session Expired. Login Again");
                return;
            }

            const user = await meRes.json();
            setUser(user);
            router.push("/home");
            toast.success("Login successful!");
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
