"use client";

import clsx from "clsx";
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
                "flex justify-center items-center gap-4 bg-cusblue text-cuscream p-2 rounded-lg font-bold transition-opacity",
                "hover:bg-cusviolet",
                (loading || disabled) && "opacity-50 cursor-not-allowed",
                className,
            )}
            {...props}>
            {loading ? "Loading..." : children}
        </button>
    );
}
