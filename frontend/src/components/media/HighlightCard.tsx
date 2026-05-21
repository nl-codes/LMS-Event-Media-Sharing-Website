"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { Media } from "@/types/Media";
import { isImageMedia } from "@/utils/HelperFunctions";

interface HighlightCardProps {
    media: Media;

    heightPx?: number;
}

const HighlightCard: React.FC<HighlightCardProps> = ({
    media,
    heightPx = 300,
}) => {
    const router = useRouter();
    const isImage = isImageMedia(media.mediaType);

    const handleClick = () => router.push(`/media/${media._id}`);

    return (
        <button
            type="button"
            onClick={handleClick}
            className="relative flex shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-md transition-transform hover:scale-[1.02]"
            style={{ height: heightPx }}
            aria-label={media.label || "Event highlight"}>
            {isImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                    src={media.mediaUrl}
                    alt={media.label || "Highlight"}
                    style={{ height: heightPx, width: "auto" }}
                    className="h-full w-auto object-cover"
                />
            ) : (
                <video
                    src={media.mediaUrl}
                    style={{ height: heightPx, width: "auto" }}
                    className="h-full w-auto object-cover"
                    muted
                    loop
                    playsInline
                    onMouseOver={(e) => e.currentTarget.play()}
                    onMouseOut={(e) => e.currentTarget.pause()}
                />
            )}
        </button>
    );
};

export default HighlightCard;
