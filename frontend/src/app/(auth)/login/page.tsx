import { Metadata } from "next";
import LoginForm from "./login-form";
import SignupNewButton from "./SignupOptions";

export const metadata: Metadata = {
    title: "Sign in | LMS 24",
    description:
        "Access your account securely and continue where you left off.",
};

export default function Home() {
    return (
        <div className="mt-40 flex gap-[100] justify-center">
            <div className="flex flex-col w-[360px] gap-5">
                <p className="font-extrabold text-4xl">Login</p>
                <p className="font-medium text-xl">
                    Where your memories come together — step back in and join
                    your story.
                </p>
                <SignupNewButton />
            </div>
            <div className="flex items-center">
                <LoginForm />
            </div>
        </div>
    );
}
