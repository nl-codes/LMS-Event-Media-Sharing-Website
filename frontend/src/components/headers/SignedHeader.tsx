"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "../buttons/Button";
import { FaRegUser } from "react-icons/fa";

export default function SignedHeader() {
    const router = useRouter();
    const handleLogoClick = () => router.replace("/home");
    const handleProfileClick = () => router.push("/profile");

    return (
        <header className="w-full pt-4">
            <div className="flex items-center justify-between px-16 pb-4 border-b-2 border-cusblue">
                {/* Logo Container */}
                <div className="cursor-pointer" onClick={handleLogoClick}>
                    <Image
                        src="https://res.cloudinary.com/dimgh55x6/image/upload/v1763878601/lms_logo_fw6m2q.png"
                        alt="Logo"
                        width={80}
                        height={80}
                        className="object-contain"
                    />
                </div>

                {/* Button - Automatically centered vertically relative to the logo */}
                <Button
                    className="flex items-center gap-2"
                    handleClick={handleProfileClick}>
                    Profile <FaRegUser />
                </Button>
            </div>
        </header>
    );
}
