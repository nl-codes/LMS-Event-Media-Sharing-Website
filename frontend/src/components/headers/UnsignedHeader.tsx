"use client";
import LandingButton from "@/components/buttons/LandingButton";
import LogoRounded200 from "../logo/Logo_Rounded_200";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UnsignedHeader() {
    const router = useRouter();
    return (
        <div className="flex justify-end gap-16 pt-4 pb-12 pr-16 border-b-2 border-cusblue">
            <LandingButton handleClick={() => {}}>
                Watch how it works{" "}
            </LandingButton>
            <LandingButton
                handleClick={() => {
                    router.push("/pricing");
                }}>
                {" "}
                Pricing{" "}
            </LandingButton>
            <LandingButton handleClick={() => {}}> Events </LandingButton>

            <Link href="/" replace>
                <LogoRounded200 />
            </Link>
        </div>
    );
}
