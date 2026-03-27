import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    type?: "button" | "submit";
    loading?: boolean;
    children: ReactNode;
    className?: string;
    handleClick?: () => void;
}
