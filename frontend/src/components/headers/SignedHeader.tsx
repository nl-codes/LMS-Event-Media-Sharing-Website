"use client";
import { useRouter } from "next/navigation";
import Button from "../buttons/Button";
import { FaRegUser } from "react-icons/fa";
import Link from "next/link";
import LogoRounded from "../logo/Logo_Rounded";
import LogoutButton from "@/components/buttons/LogoutButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import UserAvatar from "@/components/common/UserAvatar";
import { useUser } from "@/context/UserContext";

export default function SignedHeader() {
    const router = useRouter();
    const { user } = useUser();
    const userName = user?.userName ?? "";

    const handleProfileClick = () => router.push("/home/profile");

    return (
        <header className=" top-0 z-50 w-full bg-cuscream/80 backdrop-blur-md border-b border-cusblue/10">
            <div className="flex items-center justify-between gap-6 py-4 px-16">
                {/* Logo Container */}
                <Link href="/home" replace>
                    <LogoRounded size={80} />
                </Link>

                {/* Navigation Actions */}
                <div className="flex items-center gap-4">
                    <div className="text-lg font-semibold text-black">
                        {userName && `Welcome, ${userName}`}
                    </div>

                    <button
                        type="button"
                        onClick={handleProfileClick}
                        aria-label="Open profile"
                        className="rounded-full transition-transform hover:scale-105 active:scale-95">
                        <UserAvatar
                            src={user?.profilePicture}
                            name={userName}
                            size="small"
                        />
                    </button>

                    {/* Notification Bell */}
                    <NotificationBell />

                    {/* Profile Button */}
                    <Button
                        className="flex items-center gap-2"
                        handleClick={handleProfileClick}>
                        Profile <FaRegUser />
                    </Button>

                    {/* div is necessary to hold the logout content */}
                    <div>
                        <LogoutButton />
                    </div>
                </div>
            </div>
        </header>
    );
}
