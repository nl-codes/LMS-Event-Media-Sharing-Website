"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Button from "../buttons/Button";
import { FaRegUser } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { backend_url } from "@/config/backend";
import { useUser } from "@/context/UserContext";

export default function SignedHeader({ userName }: { userName: string }) {
    const router = useRouter();
    const { setUser } = useUser();

    const handleLogoClick = () => router.replace("/home");
    const handleProfileClick = () => router.push("/home/profile");

    const logout = async () => {
        try {
            await fetch(`${backend_url}/users/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch {
            // Even if the request fails, clear local state
        }
        setUser(null);
        router.push("/login");
    };

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

                {/* Navigation Actions */}
                <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold">
                        {userName && `Welcome, ${userName}`}
                    </div>
                    {/* Profile Button */}
                    <Button
                        className="flex items-center gap-2"
                        handleClick={handleProfileClick}>
                        Profile <FaRegUser />
                    </Button>

                    <Button
                        className="flex items-center gap-2"
                        handleClick={logout}>
                        Logout <FiLogOut />
                    </Button>
                </div>
            </div>
        </header>
    );
}
