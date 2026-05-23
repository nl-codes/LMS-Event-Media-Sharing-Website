"use client";
import { useRouter } from "next/navigation";
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
        <header className="relative z-50 w-full bg-cuscream/80 backdrop-blur-md border-b border-cusblue/10">
            <div className="flex items-center justify-between gap-3 sm:gap-6 py-3 sm:py-4 px-4 sm:px-8 lg:px-16">
                {/* Logo */}
                <Link href="/home" replace className="shrink-0">
                    <span className="block sm:hidden">
                        <LogoRounded size={80} className="w-12! h-12!" />
                    </span>
                    <span className="hidden sm:block">
                        <LogoRounded size={80} />
                    </span>
                </Link>

                {/* Right-side actions */}
                <div className="flex items-center gap-6 ">
                    {/* Welcome, desktop only */}
                    {userName && (
                        <div className="hidden lg:block max-w-[260px] truncate text-base lg:text-lg font-semibold text-transparent bg-linear-to-r from-cusviolet to-cusblue bg-clip-text">
                            Welcome, <span>{userName}</span>
                        </div>
                    )}

                    {/* Avatar */}
                    <button
                        type="button"
                        onClick={handleProfileClick}
                        aria-label="Open profile"
                        className="rounded-full transition-transform hover:scale-105 active:scale-95 flex items-center">
                        <UserAvatar
                            src={user?.profilePicture}
                            name={userName}
                            size="small"
                        />
                    </button>

                    {/* Notification Bell */}
                    <NotificationBell />

                    {/* Logout: text hidden on mobile */}
                    <div className="hidden lg:block">
                        <LogoutButton />
                    </div>
                    <div className="lg:hidden">
                        <LogoutButton showText={false} />
                    </div>
                </div>
            </div>
        </header>
    );
}
