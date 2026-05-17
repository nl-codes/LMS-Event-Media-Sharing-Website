"use client";
import { useRouter } from "next/navigation";
import Button from "../buttons/Button";
import { FaRegUser } from "react-icons/fa";
import Link from "next/link";
import LogoRounded from "../logo/Logo_Rounded";
import LogoutButton from "@/components/buttons/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function SignedHeader({ userName }: { userName: string }) {
    const router = useRouter();

    const handleProfileClick = () => router.push("/home/profile");

    return (
        <header className="w-full pt-4">
            <div className="flex items-center justify-between px-16 pb-4 border-b-2 border-cusblue">
                {/* Logo Container */}
                <Link href="/home" replace>
                    <LogoRounded size={80} />
                </Link>

                {/* Navigation Actions */}
                <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold text-black">
                        {userName && `Welcome, ${userName}`}
                    </div>

                    {/* Profile Button */}
                    <Button
                        className="flex items-center gap-2"
                        handleClick={handleProfileClick}>
                        Profile <FaRegUser />
                    </Button>

                    {/* Notification Bell */}
                    <NotificationBell />

                    {/* div is necessary to hold the logout content */}
                    <div>
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
