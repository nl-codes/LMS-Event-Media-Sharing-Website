"use client";
import LandingButton from "@/components/buttons/LandingButton";
import LogoRounded200 from "./Logo_200_Round";
import Link from "next/link";

export default function UnsignedHeader() {
    return (
        <div className="flex justify-end gap-16 pt-4 pb-12 pr-16 border-b-2 border-cusblue">
            <LandingButton handleClick={() => {}}>
                Watch how it works{" "}
            </LandingButton>
            <LandingButton handleClick={() => {}}> Pricing </LandingButton>
            <LandingButton handleClick={() => {}}> Events </LandingButton>

            <Link href="/" replace>
                <LogoRounded200 />
            </Link>
        </div>
    );
}
