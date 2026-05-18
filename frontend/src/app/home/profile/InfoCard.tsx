"use client";

import type { ReactNode } from "react";

type InfoCardProps = {
    icon: ReactNode;
    iconColor?: "blue" | "pink" | "emerald" | "purple";
    label: string;
    /** Either a string value or a custom node (for icons inline with text). */
    children: ReactNode;
    /** Extra classes to merge onto the value <p>. */
    valueClassName?: string;
};

const BUBBLE_STYLES: Record<NonNullable<InfoCardProps["iconColor"]>, string> = {
    blue: "bg-blue-50 text-cusblue",
    pink: "bg-pink-50 text-pink-400",
    emerald: "bg-emerald-50 text-emerald-500",
    purple: "bg-purple-50 text-purple-500",
};

export default function InfoCard({
    icon,
    iconColor = "blue",
    label,
    children,
    valueClassName = "",
}: InfoCardProps) {
    return (
        <div className="flex items-center gap-4 text-gray-600">
            <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${BUBBLE_STYLES[iconColor]}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] text-gray-400 font-bold uppercase">
                    {label}
                </p>
                <p className={`text-sm font-medium ${valueClassName}`.trim()}>
                    {children}
                </p>
            </div>
        </div>
    );
}
