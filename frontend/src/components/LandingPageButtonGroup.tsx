"use client";
import LandingButton from "@/components/buttons/LandingButton";
import { useRouter } from "next/navigation";

export default function LandingPageButtonGroup() {
    const router = useRouter();
    return (
        <div className="button-area flex gap-8 justify-center items-center">
            <LandingButton
                handleClick={() => {
                    router.push("/login");
                }}>
                Login
            </LandingButton>
            <LandingButton
                handleClick={() => {
                    router.push("/signup");
                }}>
                Signup
            </LandingButton>
        </div>
    );
}
