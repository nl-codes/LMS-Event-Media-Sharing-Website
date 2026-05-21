"use client";

import MediaCard from "@/components/media/MediaCard";
import type { Media } from "@/types/Media";

interface GalleryGridProps {
    mediaItems: Media[];
    isHost: boolean;
    currentUserId: string;
    isSelectionActive: boolean;
    selectedIds: string[];
    onSelectionToggle: (id: string) => void;
    onLike: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleHighlight?: (id: string, nextIsHighlight: boolean) => void;
    eventEnded?: boolean;
    userExists: boolean;
}

export default function GalleryGrid({
    mediaItems,
    isHost,
    currentUserId,
    isSelectionActive,
    selectedIds,
    onSelectionToggle,
    onLike,
    onDelete,
    onToggleHighlight,
    eventEnded,
    userExists,
}: GalleryGridProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {mediaItems.map((media) => (
                <MediaCard
                    key={media._id}
                    media={media}
                    isHost={isHost}
                    currentUserId={currentUserId}
                    onDelete={onDelete}
                    onLike={onLike}
                    onToggleHighlight={onToggleHighlight}
                    eventEnded={eventEnded}
                    disableLike={!userExists}
                    isSelectionActive={isSelectionActive}
                    isSelected={selectedIds.includes(media._id)}
                    onSelectionToggle={onSelectionToggle}
                />
            ))}
        </div>
    );
}
