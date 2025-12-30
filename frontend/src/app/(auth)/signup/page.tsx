import { Metadata } from "next";
import LoginExistingButton from "./LoginExistingButton";
import SignupForm from "./signup-form";

export const metadata: Metadata = {
    title: "Create Account | LMS 24",
    description: "Sign up to share, upload, and relive your moments anytime.",
};

export default function Home() {
    return (
        <div className="mt-40 flex gap-[100] justify-center">
            <div className="flex flex-col w-[360px] gap-5">
                <p className="font-extrabold text-4xl">Sign up</p>
                <p className="font-medium text-xl">
                    Ready to begin? Share, Upload and relieve your moments any
                    time.
                </p>
                <LoginExistingButton />
            </div>
            <div className="flex items-center">
                <SignupForm />
            </div>
        </div>
    );
}
