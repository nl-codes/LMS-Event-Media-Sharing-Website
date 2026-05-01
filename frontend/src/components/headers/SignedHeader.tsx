"use client";
import { useRouter } from "next/navigation";
import Button from "../buttons/Button";
import { FaRegUser } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { backend_url } from "@/config/backend";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import LogoRounded from "../logo/Logo_Rounded";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";
import toast from "react-hot-toast";

export default function SignedHeader({ userName }: { userName: string }) {
    const router = useRouter();
    const { setUser } = useUser();

    const handleProfileClick = () => router.push("/home/profile");

    // This handles the actual logout logic
    const handleLogOut = async () => {
        try {
            await fetch(`${backend_url}/users/logout`, {
                method: "POST",
                credentials: "include",
            });
        } catch (err) {
            console.error(err);
        }
        setUser(null);
        router.push("/login");
        toast.success("Log out successful!");
    };

    const handleLogOutClick = () => {
        openConfirmationDialog({
            title: "Confirm Logout",
            message: "Are you sure you want to log out of your account?",
            confirmText: "Logout",
            cancelText: "Stay",
            isDanger: true,
            onConfirm: handleLogOut,
        });
    };

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

                    <Button
                        className="flex items-center gap-2"
                        handleClick={handleLogOutClick}>
                        Logout <FiLogOut />
                    </Button>
                </div>
            </div>
        </header>
    );
}
