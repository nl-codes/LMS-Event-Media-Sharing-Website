import { Metadata } from "next";
import LoginForm from "./login-form";
import SignupNewButton from "./SignupOptions";
import { Check, Lock } from "lucide-react";

export const metadata: Metadata = {
    title: "Sign in | LMS 24",
    description:
        "Access your account securely and continue where you left off.",
};

export default function Home() {
    return (
        <main className="bg-cuscream/30 flex items-center justify-center py-20 px-6">
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 justify-center items-start max-w-6xl w-full">
                {/* Left Side: Information */}
                <div className="flex flex-col w-full lg:w-[400px] gap-6">
                    {/* Secure Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-cusblue/10 text-sm font-medium text-cusblue shadow-sm w-fit">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cusblue opacity-60"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cusblue"></span>
                        </span>
                        Secure Access Portal
                    </div>

                    <h1 className="font-extrabold text-5xl text-cusblue tracking-tight">
                        Login
                    </h1>

                    <p className="font-medium text-xl text-cusviolet/80 leading-relaxed">
                        Where your memories come together — step back in and
                        join your story.
                    </p>

                    <SignupNewButton />

                    {/* Trust Badges */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-start border-t border-cusblue/5 mt-4">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="w-8 h-8 rounded-full bg-cusblue/10 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-cusblue" />
                            </div>
                            <span>Secure encrypted connection</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="w-8 h-8 rounded-full bg-cusviolet/10 flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-cusviolet" />
                            </div>
                            <span>2FA ready</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full lg:w-[450px] bg-white/40 backdrop-blur-md p-8 lg:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-cusblue/5">
                    <LoginForm />
                </div>
            </div>
        </main>
    );
}
