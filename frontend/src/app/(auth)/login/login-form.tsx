"use client";
import LandingButton from "@/components/buttons/LandingButton";

export default function LoginForm() {
    return (
        <div className="form">
            <div className="form-section">
                <span className="label">Email</span>
                <input
                    className="form-input"
                    placeholder="johndoe@gmail.com"
                    type="email"
                />
            </div>
            <div className="form-section">
                <span className="label">Passwrod</span>
                <input
                    className="form-input"
                    placeholder="*********"
                    type="password"
                />
            </div>
            <div className="form-section  pt-4">
                <LandingButton
                    handleClick={() => {}}
                    className="bg-cusblue text-cuscream p-2 rounded-lg font-bold hover:bg-cusviolet hover:cursor-pointer h-12">
                    Login
                </LandingButton>
            </div>
        </div>
    );
}
