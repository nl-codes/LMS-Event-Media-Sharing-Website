"use client";

import React from "react";
import type { Media } from "@/types/Media";
import MediaCard from "./MediaCard";

interface HighlightsGridProps {
    highlights: Media[];
    isHost: boolean;
    currentUserId: string;
    onToggleHighlight?: (mediaId: string, nextIsHighlight: boolean) => void;
}

const HighlightsGrid: React.FC<HighlightsGridProps> = ({
    highlights,
    isHost,
    currentUserId,
    onToggleHighlight,
}) => {
    if (!highlights.length) return null;

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-amber-500">
                ⭐ Highlights
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {highlights.map((media) => (
                    <MediaCard
                        key={media._id}
                        media={media}
                        isHost={isHost}
                        currentUserId={currentUserId}
                        disableLike={true}
                        eventEnded={true}
                        onToggleHighlight={onToggleHighlight}
                    />
                ))}
            </div>
        </div>
    );
};

export default HighlightsGrid;
