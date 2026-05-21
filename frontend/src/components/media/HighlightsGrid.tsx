"use client";

import React, { useState } from "react";
import type { Media } from "@/types/Media";
import MediaCard from "./MediaCard";
import HighlightsCarousel from "./HighlightsCarousel";
import { Images, Sparkles } from "lucide-react";
import Button from "../buttons/Button";

interface HighlightsGridProps {
    highlights: Media[];
    isHost: boolean;
    currentUserId: string;
    onLike?: (mediaId: string) => void;
    disableLike?: boolean;
    onToggleHighlight?: (mediaId: string, nextIsHighlight: boolean) => void;
}

const HighlightsGrid: React.FC<HighlightsGridProps> = ({
    highlights,
    isHost,
    currentUserId,
    onLike,
    disableLike,
    onToggleHighlight,
}) => {
    const [showMore, setShowMore] = useState(false);
    const toggleShowMore = () => setShowMore(!showMore);

    if (!highlights.length) return null;

    if (!isHost) {
        return <HighlightsCarousel highlights={highlights} />;
    }

    const highlightLabel = highlights.length === 1 ? "highlight" : "highlights";

    return (
        <section className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/60 p-4 shadow-xl shadow-cusblue/5 backdrop-blur-md sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 fill-current" />
                        Curated moments
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-cusblue sm:text-3xl">
                        Event Highlights
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-cusviolet/75">
                        A polished set of standout images from this event, ready
                        for guests to revisit.
                    </p>
                </div>

                <div className="flex  flex-col gap-4 items-center">
                    <Button handleClick={toggleShowMore}>
                        {showMore ? "Hide Highlights" : "Show Highlights"}
                    </Button>
                    <div className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cusblue/10 bg-white px-4 py-3 text-sm font-black text-cusblue shadow-sm">
                        <Images className="h-4 w-4 text-cusviolet" />
                        {highlights.length} {highlightLabel}
                    </div>
                </div>
            </div>

            <div
                className={`grid gap-4 transition-all duration-500 ease-in-out ${
                    showMore
                        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 opacity-100 translate-y-0"
                        : "max-h-0 opacity-0 translate-y-4 pointer-events-none"
                }`}>
                {showMore &&
                    highlights.map((media) => (
                        <MediaCard
                            key={media._id}
                            media={media}
                            isHost={isHost}
                            currentUserId={currentUserId}
                            onLike={onLike}
                            disableLike={disableLike}
                            eventEnded={true}
                            onToggleHighlight={onToggleHighlight}
                        />
                    ))}
            </div>
        </section>
    );
};

export default HighlightsGrid;
