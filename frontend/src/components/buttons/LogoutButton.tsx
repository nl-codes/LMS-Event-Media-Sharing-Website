"use client";

import clsx from "clsx";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";
import { backend_url } from "@/config/backend";
import { useUser } from "@/context/UserContext";

type LogoutButtonProps = {
    className?: string;
    redirectTo?: string;
    showText?: boolean;
};

export default function LogoutButton({
    className,
    redirectTo = "/login",
    showText = true,
}: LogoutButtonProps) {
    const router = useRouter();
    const { setUser } = useUser();

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
        router.push(redirectTo);
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
        <button
            type="button"
            onClick={handleLogOutClick}
            className={clsx(
                "flex w-full min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-rose-600/80 transition-all hover:bg-rose-500/10 hover:text-rose-700",
                className,
            )}>
            <LogOut className="h-5 w-5" />
            {showText && "Logout"}
        </button>
    );
}
