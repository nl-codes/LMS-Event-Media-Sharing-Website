import React, { useEffect, useState } from "react";
import { getHighlights } from "@/lib/mediaApi";
import type { Media } from "@/types/Media";
import MediaCard from "./MediaCard";
import toast from "react-hot-toast";

interface HighlightsGridProps {
    eventId: string;
    isHost: boolean;
    currentUserId: string;
}

const HighlightsGrid: React.FC<HighlightsGridProps> = ({
    eventId,
    isHost,
    currentUserId,
}) => {
    const [highlights, setHighlights] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;

        // Note: We REMOVED setLoading(true) from here because
        // the state already starts as 'true'.

        async function fetchHighlights() {
            try {
                const data = await getHighlights(eventId);
                if (isMounted) setHighlights(data);
            } catch (err) {
                if (isMounted) {
                    const msg =
                        err instanceof Error
                            ? err.message
                            : "Failed to load highlights";
                    toast.error(msg);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchHighlights();

        return () => {
            isMounted = false; // Cleanup to prevent memory leaks/state updates on unmounted components
        };
    }, [eventId]);

    if (loading)
        return <div className="py-4 text-center">Loading highlights...</div>;

    // It's often better to return null or a hidden state if there are no highlights
    // so the "All Media" section below it moves up cleanly.
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
                    />
                ))}
            </div>
        </div>
    );
};

export default HighlightsGrid;
