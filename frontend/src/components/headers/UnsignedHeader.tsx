"use client";

import Button from "@/components/buttons/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlayCircle, Tag, Calendar, LogIn, Menu, X } from "lucide-react";
import { useState } from "react";
import LogoRounded from "../logo/Logo_Rounded";

export default function UnsignedHeader() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const close = () => setOpen(false);

    const navItems = (
        <>
            <Button
                className="w-full sm:w-auto justify-center"
                handleClick={close}>
                <PlayCircle className="w-4 h-4 opacity-70" />
                How it works
            </Button>

            <Button
                className="w-full sm:w-auto justify-center"
                handleClick={() => {
                    close();
                    router.push("/pricing");
                }}>
                <Tag className="w-4 h-4 opacity-70" />
                Pricing
            </Button>

            <Button
                className="w-full sm:w-auto justify-center"
                handleClick={close}>
                <Calendar className="w-4 h-4 opacity-70" />
                Events
            </Button>

            <Button
                className="w-full sm:w-auto justify-center"
                handleClick={() => {
                    close();
                    router.push("/login");
                }}>
                <LogIn className="w-4 h-4 opacity-70" />
                Login
            </Button>
        </>
    );

    return (
        <header className="relative z-50 w-full bg-cuscream/80 backdrop-blur-md border-b border-cusblue/10">
            <div className="flex items-center justify-between gap-3 sm:gap-6 py-3 sm:py-4 px-4 sm:px-8 lg:px-16">
                <Link href="/" replace className="shrink-0">
                    <span className="block sm:hidden">
                        <LogoRounded size={80} className="w-12! h-12!" />
                    </span>
                    <span className="hidden sm:block">
                        <LogoRounded size={80} />
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-2">
                    {navItems}
                </nav>

                {/* Mobile menu toggle */}
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    className="lg:hidden p-2 rounded-lg text-cusblue hover:bg-cusblue/10 transition-colors">
                    {open ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <Menu className="w-6 h-6" />
                    )}
                </button>
            </div>

            {/* Mobile dropdown */}
            {open && (
                <nav className="lg:hidden border-t border-cusblue/10 bg-cuscream/95 backdrop-blur-md px-4 py-4 flex flex-col gap-3">
                    {navItems}
                </nav>
            )}
        </header>
    );
}
