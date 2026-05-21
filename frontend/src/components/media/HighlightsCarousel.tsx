"use client";

import Marquee from "react-fast-marquee";
import type { Media } from "@/types/Media";
import HighlightCard from "./HighlightCard";

interface HighlightsCarouselProps {
    highlights: Media[];
}

const ROW_HEIGHT_PX = 240;
const SCROLL_SPEED_PX_PER_SEC = 80;

const HighlightsCarousel: React.FC<HighlightsCarouselProps> = ({
    highlights,
}) => {
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
                {highlights.map((media) => (
                    <div key={media._id} className="mr-4">
                        <HighlightCard media={media} heightPx={ROW_HEIGHT_PX} />
                    </div>
                ))}
            </Marquee>
        </div>
    );
};

export default HighlightsCarousel;
