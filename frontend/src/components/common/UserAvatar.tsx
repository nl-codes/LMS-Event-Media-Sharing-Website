"use client";

import Image from "next/image";

export type AvatarSize = "extraSmall" | "small" | "medium" | "large";

type UserAvatarProps = {
    src?: string | null;
    name?: string | null;
    size?: AvatarSize;
    className?: string;
    onClick?: () => void;
};

const SIZE_PX: Record<AvatarSize, number> = {
    extraSmall: 24,
    small: 32,
    medium: 64,
    large: 128,
};

const COLORS = [
    "#4F46E5",
    "#7C3AED",
    "#DB2777",
    "#059669",
    "#D97706",
    "#DC2626",
    "#0284C7",
    "#65A30D",
];

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++)
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return COLORS[Math.abs(hash) % COLORS.length];
}

export default function UserAvatar({
    src,
    name,
    size = "medium",
    className,
    onClick,
}: UserAvatarProps) {
    const px = SIZE_PX[size];
    const safeName = (name && name.trim()) || "User";
    const safeSrc = src && src.trim().length > 0 ? src : null;

    return (
        <span
            onClick={onClick}
            className={`inline-block shrink-0 ${className ?? ""}`}
            style={{ width: px, height: px }}>
            {safeSrc ? (
                <Image
                    src={safeSrc}
                    alt={safeName}
                    width={px}
                    height={px}
                    className="rounded-full object-cover"
                    style={{ width: px, height: px }}
                    unoptimized
                />
            ) : (
                <span
                    className="flex items-center justify-center rounded-full text-white font-bold select-none"
                    style={{
                        width: px,
                        height: px,
                        backgroundColor: getColor(safeName),
                        fontSize: px / 2.2,
                    }}>
                    {getInitials(safeName)}
                </span>
            )}
        </span>
    );
}
