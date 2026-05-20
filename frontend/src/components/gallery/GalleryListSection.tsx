"use client";

import GalleryGrid from "@/components/events/GalleryGrid";
import type { Media } from "@/types/Media";

interface GalleryListSectionProps {
    mediaItems: Media[];
    isLoading: boolean;
    isHost: boolean;
    currentUserId: string;
    userExists: boolean;
    isSelectionActive: boolean;
    selectedIds: string[];
    onSelectionToggle: (mediaId: string) => void;
    onLike: (mediaId: string) => void;
    onDelete: (mediaId: string) => void;
}

export default function GalleryListSection({
    mediaItems,
    isLoading,
    isHost,
    currentUserId,
    userExists,
    isSelectionActive,
    selectedIds,
    onSelectionToggle,
    onLike,
    onDelete,
}: GalleryListSectionProps) {
    return (
        <>
            <h2 className="text-xl font-semibold mt-8 mb-2">All Media</h2>

            {isLoading ? (
                <div className="py-10 text-center">Loading gallery...</div>
            ) : !mediaItems.length ? (
                <div className="py-10 text-center text-gray-500">
                    No media uploaded yet.
                </div>
            ) : (
                <GalleryGrid
                    mediaItems={mediaItems}
                    isHost={isHost}
                    currentUserId={currentUserId}
                    isSelectionActive={isSelectionActive}
                    selectedIds={selectedIds}
                    onSelectionToggle={onSelectionToggle}
                    onLike={onLike}
                    onDelete={onDelete}
                    userExists={userExists}
                />
            )}
        </>
    );
}
