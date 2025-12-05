"use client";
import LandingButton from "@/components/buttons/LandingButton";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function SignupForm() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSignup = async () => {
        // Null checks
        if (!email || !userName || !password) {
            toast.error("All fields are required");
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            toast.error("Enter a valid email");
            return;
        }

        // Passwords match
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            const res = await fetch("http://localhost:3000/users/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    userName,
                    password,
                }),
            });

            const data = await res.json();
            console.log("Signup response:", data);

            if (!res.ok) {
                toast.error(data.message || "Signup failed");
                return;
            }

            // Successful Signup
            toast.success("Signup successful!");
            router.push("/login");
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong");
        }
    };

    return (
        <div className="form">
            <div className="form-section">
                <span className="label">Email</span>
                <input
                    className="form-input"
                    placeholder="johndoe@gmail.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="form-section">
                <span className="label">Username</span>
                <input
                    className="form-input"
                    placeholder="johndoe_25"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
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

            <div className="form-section">
                <span className="label">Confirm Password</span>
                <input
                    className="form-input"
                    placeholder="*********"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
            </div>

            <div className="form-section pt-4">
                <LandingButton
                    handleClick={handleSignup}
                    className="bg-cusblue text-cuscream p-2 rounded-lg font-bold hover:bg-cusviolet hover:cursor-pointer h-12">
                    Sign up
                </LandingButton>
            </div>
        </div>
    );
}
