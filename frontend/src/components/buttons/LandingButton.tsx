"use client";
import clsx from "clsx";
import { ButtonProps } from "./buttonDefinition";

export default function LandingButton({
    children,
    className,
    handleClick,
}: ButtonProps) {
    return (
        <button
            onClick={handleClick}
            className={clsx(
                "bg-cusblue text-cuscream p-2 rounded-lg font-bold hover:bg-cusviolet hover:cursor-pointer",
                className
            )}>
            {children}
        </button>
    );
}
