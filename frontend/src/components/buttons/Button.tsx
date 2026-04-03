"use client";

import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { ButtonProps } from "./buttonDefinition";

export default function Button({
    children,
    className,
    handleClick,
    type = "button",
    loading = false,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            onClick={handleClick}
            disabled={loading || disabled}
            className={clsx(
                "relative flex justify-center items-center gap-2 overflow-hidden",
                "bg-linear-to-r from-cusblue to-cusviolet text-cuscream",
                "px-6 py-3 rounded-2xl font-bold text-sm tracking-wide",

                "transition-all duration-300 active:scale-[0.97] hover:brightness-110 hover:shadow-lg hover:shadow-cusblue/20 hover:cursor-pointer",

                // States
                (loading || disabled) &&
                    "opacity-70 cursor-not-allowed grayscale-[0.2]",
                className,
            )}
            {...props}>
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin text-white/80" />
                    <span className="opacity-80">Loading...</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
