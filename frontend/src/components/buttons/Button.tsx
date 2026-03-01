"use client";

import clsx from "clsx";
import { ButtonProps } from "./buttonDefinition";

export default function Button({
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
                "flex justify-center items-center gap-4 bg-cusblue text-cuscream p-2 rounded-lg font-bold transition-opacity",
                "hover:bg-cusviolet",
                loading && "opacity-50 cursor-not-allowed",
                className
            )}>
            {loading ? "Loading..." : children}
        </button>
    );
}
