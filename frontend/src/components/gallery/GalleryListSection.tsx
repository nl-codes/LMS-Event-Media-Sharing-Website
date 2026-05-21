"use client";

import { Images, LayoutGrid } from "lucide-react";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import GalleryAwards from "@/components/gallery/GalleryAwards";
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
    onToggleHighlight?: (mediaId: string, nextIsHighlight: boolean) => void;
    eventEnded?: boolean;
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
    onToggleHighlight,
    eventEnded,
}: GalleryListSectionProps) {
    const itemLabel = mediaItems.length === 1 ? "item" : "items";

    return (
        <section className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/30 p-4 shadow-xl shadow-cusblue/5 backdrop-blur-md sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cusblue/10 bg-cusblue/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-cusblue shadow-sm">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        Gallery
                    </div>
                    <h2 className="text-2xl font-black tracking-tight text-cusblue sm:text-3xl">
                        Media of the Event
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm font-medium leading-6 text-cusviolet/75">
                        Every upload from this event, newest first. Like, share,
                        or curate as a highlight.
                    </p>
                </div>

                <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cusblue/10 bg-white px-4 py-3 text-sm font-black text-cusblue shadow-sm sm:self-end">
                    <Images className="h-4 w-4 text-cusviolet" />
                    {mediaItems.length} {itemLabel}
                </div>
            </div>

            {!isLoading && mediaItems.length > 0 && (
                <div className="mb-5">
                    <GalleryAwards mediaItems={mediaItems} />
                </div>
            )}

            {isLoading ? (
                <div className="py-10 text-center text-sm font-bold text-cusviolet/60">
                    Loading gallery...
                </div>
            ) : !mediaItems.length ? (
                <div className="py-10 text-center text-sm font-bold text-cusviolet/60">
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
                    onToggleHighlight={onToggleHighlight}
                    eventEnded={eventEnded}
                    userExists={userExists}
                />
            )}
        </section>
    );
}
