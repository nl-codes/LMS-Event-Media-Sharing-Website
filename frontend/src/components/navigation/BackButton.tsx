"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BackButtonProps {
    href?: string;
    label?: string;
    replace?: boolean;
}

export default function BackButton({ href, label, replace }: BackButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        const navigate = replace ? router.replace : router.push;
        if (href) navigate(href);

        router.back();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label={label || "Go back"}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white bg-white/60 px-3 py-2 backdrop-blur-md transition-all hover:scale-105 hover:bg-white active:scale-95">
            <ArrowLeft className="h-5 w-5 text-cusblue" />
            {label && (
                <span className="text-sm font-semibold text-cusblue/85">
                    {label}
                </span>
            )}
        </button>
    );
}
