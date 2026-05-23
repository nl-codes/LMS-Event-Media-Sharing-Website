"use client";

import Button from "@/components/buttons/Button";
import { useRouter } from "next/navigation";
import { ArrowRight, UserPlus } from "lucide-react";

export default function LandingPageButtonGroup() {
    const router = useRouter();

    return (
        <div className="button-area flex w-full gap-3 sm:gap-6 justify-center items-center">
            <Button
                handleClick={() => router.push("/login")}
                className="flex-1 sm:flex-none sm:w-48 shadow-xl">
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
            </Button>

            <Button
                handleClick={() => router.push("/signup")}
                className="flex-1 sm:flex-none sm:w-48 shadow-xl">
                <span>Sign up</span>
                <UserPlus className="w-4 h-4" />
            </Button>
        </div>
    );
}
