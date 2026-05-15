import { Metadata } from "next";
import Link from "next/link";
import { Check, Lock } from "lucide-react";
import AdminLoginForm from "./admin-login-form";

export const metadata: Metadata = {
    title: "Admin Sign in | LMS 24",
    description: "Access the LMS 24 admin management system.",
};

export default function AdminLoginPage() {
    return (
        <main className="bg-cuscream/30 flex items-center justify-center py-20 px-6">
            <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 justify-center items-start max-w-6xl w-full">
                <div className="flex flex-col w-full lg:w-[400px] gap-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-sm border border-cusblue/10 text-sm font-medium text-cusblue shadow-sm w-fit">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cusblue opacity-60" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-cusblue" />
                        </span>
                        Admin Access Portal
                    </div>

                    <h1 className="font-extrabold text-5xl text-cusblue tracking-tight">
                        Admin login
                    </h1>

                    <p className="font-medium text-xl text-cusviolet/80 leading-relaxed">
                        Review platform activity, manage accounts, and keep
                        event spaces running smoothly.
                    </p>

                    <Link
                        href="/admin/signup"
                        className="inline-flex w-fit items-center justify-center rounded-2xl border border-cusblue/10 bg-white/60 px-5 py-3 text-sm font-bold text-cusblue shadow-sm transition-all hover:bg-white hover:shadow-lg hover:shadow-cusblue/10">
                        Request admin access
                    </Link>

                    <div className="flex flex-col sm:flex-row gap-4 pt-8 justify-start border-t border-cusblue/5 mt-4">
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="w-8 h-8 rounded-full bg-cusblue/10 flex items-center justify-center shrink-0">
                                <Check className="w-4 h-4 text-cusblue" />
                            </div>
                            <span>Role based access</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <div className="w-8 h-8 rounded-full bg-cusviolet/10 flex items-center justify-center shrink-0">
                                <Lock className="w-4 h-4 text-cusviolet" />
                            </div>
                            <span>OTP protected</span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-[450px] bg-white/40 backdrop-blur-md p-8 lg:p-10 rounded-[2.5rem] border border-white shadow-2xl shadow-cusblue/5">
                    <AdminLoginForm />
                </div>
            </div>
        </main>
    );
}
