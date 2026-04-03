"use client";

import Button from "@/components/buttons/Button";
import { useRouter } from "next/navigation";
import { ArrowRight, UserPlus } from "lucide-react";

export default function LandingPageButtonGroup() {
    const router = useRouter();

    return (
        <div className="button-area flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            <Button
                handleClick={() => router.push("/login")}
                className="w-full sm:w-48 shadow-xl">
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
                handleClick={() => router.push("/signup")}
                className="w-full sm:w-48 shadow-xl">
                <span>Sign up</span>
                <UserPlus className="w-4 h-4" />
            </Button>
        </div>
    );
}
