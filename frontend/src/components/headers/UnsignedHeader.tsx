"use client";

import Button from "@/components/buttons/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlayCircle, Tag, Calendar } from "lucide-react";
import LogoRounded from "../logo/Logo_Rounded";

export default function UnsignedHeader() {
    const router = useRouter();

    return (
        <header className="flex items-center justify-between gap-6 py-4 px-16 border-b border-cusblue/10 bg-cuscream/80 backdrop-blur-md sticky top-0 z-50">
            <Link href="/" replace>
                <LogoRounded size={100} />
            </Link>
            {/* Navigation Group */}
            <nav className="flex items-center gap-2">
                <Button handleClick={() => {}}>
                    <PlayCircle className="w-4 h-4 opacity-70" />
                    How it works
                </Button>

                <Button handleClick={() => router.push("/pricing")}>
                    <Tag className="w-4 h-4 opacity-70" />
                    Pricing
                </Button>

                <Button handleClick={() => {}}>
                    <Calendar className="w-4 h-4 opacity-70" />
                    Events
                </Button>
            </nav>
        </header>
    );
}
