"use client";

import { useEffect, useState, useCallback } from "react";
import {
    getGallery,
    deleteMedia,
    toggleLike,
    deleteMultipleMedia,
} from "@/lib/mediaApi";
import { getEventById } from "@/lib/eventApi";
import type { Media } from "@/types/Media";
import type { Event } from "@/types/Event";
import MediaCard from "@/components/media/MediaCard";
import MediaUploadButton from "@/components/media/MediaUploadButton";
import HighlightsGrid from "@/components/media/HighlightsGrid";
import GalleryEventHeader from "@/components/events/GalleryEventHeader";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useGallerySocket } from "@/hooks/useGallerySocket";

const MAX_BULK_DELETE_ITEMS = 20;

function normalizeLikedByIds(likedBy: unknown): string[] {
    if (!Array.isArray(likedBy)) return [];

    return likedBy
        .map((entry) => {
            if (typeof entry === "string") return entry;
            if (
                entry &&
                typeof entry === "object" &&
                "_id" in entry &&
                typeof entry._id === "string"
            ) {
                return entry._id;
            }
            return "";
        })
        .filter(Boolean);
}

function normalizeMediaLikes(media: Media): Media {
    return {
        ...media,
        likedBy: normalizeLikedByIds(media.likedBy),
    };
}

const GalleryPage = () => {
    const params = useParams();
    const eventId = typeof params?.id === "string" ? params.id : "";
    const { user } = useUser();
    const [event, setEvent] = useState<Event | null>(null);
    const [gallery, setGallery] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const currentUserId = user?._id || "";

    useGallerySocket({
        eventId,
        onNewMedia: (media) => {
            setGallery((prev) =>
                prev.find((m) => m._id === media._id)
                    ? prev
                    : [normalizeMediaLikes(media), ...prev],
            );
        },
        onMediaDeleted: (mediaId) => {
            setGallery((prev) => prev.filter((m) => m._id !== mediaId));
            setSelectedIds((prev) => prev.filter((id) => id !== mediaId));
        },
        onMediaLiked: () => {},
    });

    const fetchGallery = useCallback(async () => {
        try {
            const data = await getGallery(eventId);
            setGallery(data.map(normalizeMediaLikes));
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load gallery";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    const fetchEventDetails = useCallback(async () => {
        if (!eventId) return;

        try {
            const event = await getEventById(eventId);
            setEvent(event);

            const hostId =
                typeof event.hostId === "string"
                    ? event.hostId
                    : event.hostId?._id || "";

            setIsHost(hostId === currentUserId);
        } catch {
            setEvent(null);
            setIsHost(false);
        }
    }, [eventId, currentUserId]);

    useEffect(() => {
        if (!user) return;

        fetchGallery();
        fetchEventDetails();
    }, [user, fetchGallery, fetchEventDetails]);

    if (!user) {
        return (
            <div className="p-8 text-center">
                You must be logged in to view the gallery.
            </div>
        );
    }

    const handleDelete = async (mediaId: string) => {
        try {
            await deleteMedia(mediaId);
            toast.success("Media deleted");
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Delete failed";
            toast.error(errorMessage);
        }
    };

    const toggleSelectMode = () => {
        if (!isHost) return;
        setIsSelectMode((prev) => !prev);
        setSelectedIds([]);
    };

    const handleSelectToggle = (mediaId: string) => {
        if (!isSelectMode) return;

        setSelectedIds((prev) => {
            if (prev.includes(mediaId)) {
                return prev.filter((id) => id !== mediaId);
            }

            if (prev.length >= MAX_BULK_DELETE_ITEMS) {
                toast.error("You can select up to 20 items only");
                return prev;
            }

            return [...prev, mediaId];
        });
    };

    const handleConfirmBulkDelete = () => {
        if (!selectedIds.length) return;

        const selectedCount = selectedIds.length;
        const idsToDelete = [...selectedIds];

        openConfirmationDialog({
            title: "Delete selected media?",
            message: `This will permanently delete ${selectedCount} media item${selectedCount > 1 ? "s" : ""}. This action cannot be undone.`,
            confirmText: "Delete",
            cancelText: "Cancel",
            isDanger: true,
            onConfirm: async () => {
                await toast.promise(deleteMultipleMedia(idsToDelete), {
                    loading: "Deleting selected media...",
                    success: `Deleted ${selectedCount} item${selectedCount > 1 ? "s" : ""}`,
                    error: (err) =>
                        err instanceof Error
                            ? err.message
                            : "Bulk delete failed",
                });

                setGallery((prev) =>
                    prev.filter((media) => !idsToDelete.includes(media._id)),
                );
                setSelectedIds([]);
                setIsSelectMode(false);
            },
        });
    };

    const handleLike = async (mediaId: string) => {
        const previousGallery = gallery;

        setGallery((prev) =>
            prev.map((media) => {
                if (media._id !== mediaId) return media;

                const likedBy = normalizeLikedByIds(media.likedBy);
                const alreadyLiked = likedBy.includes(currentUserId);
                const nextLikedBy = alreadyLiked
                    ? likedBy.filter((id) => id !== currentUserId)
                    : [...likedBy, currentUserId];

                return {
                    ...media,
                    likedBy: nextLikedBy,
                    likesCount: alreadyLiked
                        ? Math.max(0, media.likesCount - 1)
                        : media.likesCount + 1,
                };
            }),
        );

        try {
            await toggleLike(mediaId);
        } catch (err) {
            setGallery(previousGallery);
            const errorMessage =
                err instanceof Error ? err.message : "Like failed";
            toast.error(errorMessage);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4">
            {event && (
                <GalleryEventHeader
                    event={event}
                    subtitle="Host Event Gallery"
                    actionSlot={
                        <div className="rounded-2xl bg-white/60 p-4 shadow-sm backdrop-blur-md">
                            <div className="flex flex-wrap items-center gap-3">
                                <MediaUploadButton
                                    eventId={eventId}
                                    onUploadSuccess={() => {
                                        void fetchGallery();
                                    }}
                                />

                                {isHost && !isSelectMode && (
                                    <button
                                        type="button"
                                        onClick={toggleSelectMode}
                                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                                        Bulk Delete
                                    </button>
                                )}

                                {isHost && isSelectMode && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleConfirmBulkDelete}
                                            disabled={!selectedIds.length}
                                            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
                                            Confirm Delete ({selectedIds.length}
                                            )
                                        </button>
                                        <button
                                            type="button"
                                            onClick={toggleSelectMode}
                                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                                            Cancel
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    }
                />
            )}

            <HighlightsGrid
                eventId={eventId}
                isHost={isHost}
                currentUserId={currentUserId}
            />

            <h2 className="text-xl font-semibold mt-8 mb-2">All Media</h2>

            {loading ? (
                <div className="py-10 text-center">Loading gallery...</div>
            ) : !gallery.length ? (
                <div className="py-10 text-center text-gray-500">
                    No media uploaded yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {gallery.map((media) => (
                        <MediaCard
                            key={media._id}
                            media={media}
                            isHost={isHost}
                            currentUserId={currentUserId}
                            onDelete={handleDelete}
                            onLike={handleLike}
                            disableLike={!user}
                            isSelectMode={isSelectMode}
                            isSelected={selectedIds.includes(media._id)}
                            onSelectToggle={handleSelectToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GalleryPage;
