"use client";

import clsx from "clsx";
import { ButtonProps } from "./buttonDefinition";

export default function LandingButton({
    children,
    className,
    handleClick,
    type = "button",
    loading = false,
}: ButtonProps) {
    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={loading}
            className={clsx(
                "bg-cusblue text-cuscream p-2 rounded-lg font-bold transition-opacity",
                "hover:bg-cusviolet",
                loading && "opacity-50 cursor-not-allowed",
                className
            )}>
            {loading ? "Loading..." : children}
        </button>
    );
}
