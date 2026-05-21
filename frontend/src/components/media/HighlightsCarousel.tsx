"use client";

import { useMemo } from "react";
import Marquee from "react-fast-marquee";
import type { Media } from "@/types/Media";
import HighlightCard from "./HighlightCard";

interface HighlightsCarouselProps {
    highlights: Media[];
}

const ROW_HEIGHT_PX = 240;
const SCROLL_SPEED_PX_PER_SEC = 80;

const shuffled = <T,>(arr: T[]): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({
    highlights,
}) => {
    const signature = highlights.map((m) => m._id).join(",");
    const display = useMemo(
        () => shuffled(highlights),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [signature],
    );

    if (!highlights.length) return null;

    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-amber-500">
                ⭐ Highlights
            </h2>
            <Marquee
                pauseOnHover
                speed={SCROLL_SPEED_PX_PER_SEC}
                gradient
                gradientColor="#fffdd0"
                gradientWidth={24}>
                {display.map((media) => (
                    <div key={media._id} className="mr-4">
                        <HighlightCard media={media} heightPx={ROW_HEIGHT_PX} />
                    </div>
                ))}
            </Marquee>
        </div>
    );
};

export default HighlightsCarousel;
