"use client";
import { useRouter } from "next/navigation";
import Button from "../buttons/Button";
import { FaRegUser } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { backend_url } from "@/config/backend";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import LogoRounded from "../logo/Logo_Rounded";

export default function SignedHeader({ userName }: { userName: string }) {
    const router = useRouter();
    const { setUser } = useUser();

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
                <Link href="/home" replace>
                    <LogoRounded size={80} />
                </Link>

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
