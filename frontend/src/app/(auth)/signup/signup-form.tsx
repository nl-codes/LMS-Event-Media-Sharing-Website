"use client";
import LandingButton from "@/components/buttons/LandingButton";

export default function SignupForm() {
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
                <span className="label">Username</span>
                <input
                    className="form-input"
                    placeholder="johndoe_25"
                    type="text"
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
            <div className="form-section">
                <span className="label">Confirm password</span>
                <input
                    className="form-input"
                    placeholder="*********"
                    type="password"
                />
            </div>
            <div className="form-section pt-4">
                <LandingButton
                    handleClick={() => {}}
                    className="bg-cusblue text-cuscream p-2 rounded-lg font-bold hover:bg-cusviolet hover:cursor-pointer h-12">
                    Sign up
                </LandingButton>
            </div>
        </div>
    );
}
