"use client";
import LandingButton from "@/components/buttons/LandingButton";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function UnsignedHeader() {
    const router = useRouter();
    const handleLogoClick = () => router.replace("/");
    return (
        <div className="flex justify-end gap-16 pt-4 pb-12 pr-16 border-b-2 border-cusblue">
            <LandingButton handleClick={() => {}}>
                Watch how it works{" "}
            </LandingButton>
            <LandingButton handleClick={() => {}}> Pricing </LandingButton>
            <LandingButton handleClick={() => {}}> Events </LandingButton>
            <Image
                onClick={handleLogoClick}
                src="https://res.cloudinary.com/dimgh55x6/image/upload/v1763878601/lms_logo_fw6m2q.png"
                width={200}
                height={200}
                className="absolute left-16"
                alt="Logo of LMS"
            />
        </div>
    );
}
