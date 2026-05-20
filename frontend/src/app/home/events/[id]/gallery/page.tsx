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
import MediaUploadButton from "@/components/media/MediaUploadButton";
import HighlightsGrid from "@/components/media/HighlightsGrid";
import GalleryEventHeader from "@/components/events/GalleryEventHeader";
import GalleryGrid from "@/components/events/GalleryGrid";
import SelectionActionBar from "@/components/events/SelectionActionBar";
import BackButton from "@/components/navigation/BackButton";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useGallerySocket } from "@/hooks/useGallerySocket";
import { useSelection } from "@/hooks/useSelection";
import {
    downloadAsZip,
    normalizeLikedByIds,
    normalizeMediaLikes,
} from "@/utils/HelperFunctions";

const MAX_BULK_DELETE_ITEMS = 20;

const GalleryPage = () => {
    const params = useParams();
    const eventId = typeof params?.id === "string" ? params.id : "";
    const { user } = useUser();
    const [event, setEvent] = useState<Event | null>(null);
    const [gallery, setGallery] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [isHost, setIsHost] = useState(false);
    const {
        isActive: isSelectionActive,
        selectedIds,
        start: handleStartSelection,
        clear: handleClearSelection,
        toggle: handleSelectToggle,
        remove: handleRemoveFromSelection,
    } = useSelection({ canStart: () => isHost });

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
            handleRemoveFromSelection(mediaId);
        },
        onMediaLiked: ({ mediaId, likesCount, userId, liked }) => {
            setGallery((prev) =>
                prev.map((media) => {
                    if (media._id !== mediaId) return media;

                    const likedBy = normalizeLikedByIds(media.likedBy);
                    const nextLikedBy =
                        typeof liked === "boolean" && userId
                            ? liked
                                ? [...new Set([...likedBy, userId])]
                                : likedBy.filter((id) => id !== userId)
                            : likedBy;

                    return {
                        ...media,
                        likedBy: nextLikedBy,
                        likesCount,
                    };
                }),
            );
        },
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

    const handleConfirmBulkDelete = () => {
        if (!selectedIds.length) return;

        const selectedCount = selectedIds.length;

        if (selectedCount >= MAX_BULK_DELETE_ITEMS) {
            toast.error("You can only delete 20 items at a time");
            return;
        }
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
                handleClearSelection();
            },
        });
    };

    const handleDownloadMedia = () => {
        const mediaToDownload = isSelectionActive
            ? gallery.filter((media) => selectedIds.includes(media._id))
            : gallery;

        if (!mediaToDownload.length) return;

        const zipName = isSelectionActive
            ? `${event?.eventName || "event-gallery"}-selected-media`
            : `${event?.eventName || "event-gallery"}-all-media`;

        void downloadAsZip(mediaToDownload, zipName);
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
            const result = await toggleLike(mediaId);
            setGallery((prev) =>
                prev.map((media) =>
                    media._id === mediaId
                        ? {
                              ...media,
                              likesCount: result.likesCount,
                          }
                        : media,
                ),
            );
        } catch (err) {
            setGallery(previousGallery);
            const errorMessage =
                err instanceof Error ? err.message : "Like failed";
            toast.error(errorMessage);
        }
    };

    const hostObject =
        event && typeof event.hostId === "object" && event.hostId
            ? event.hostId
            : null;
    const hostDisplayName =
        (hostObject &&
            (("username" in hostObject && hostObject.username) ||
                ("userName" in (hostObject as { userName?: string }) &&
                    (hostObject as { userName?: string }).userName) ||
                ("email" in hostObject && hostObject.email))) ||
        "Host";
    const gallerySubtitle = isHost
        ? "Your Event Gallery"
        : `${hostDisplayName}'s Gallery`;

    return (
        <div className="max-w-5xl mx-auto p-4">
            <div className="mb-4 flex flex-row items-center gap-4">
                <BackButton label="Back to Event" />
            </div>

            {event && (
                <GalleryEventHeader event={event} subtitle={gallerySubtitle} />
            )}

            <div className="w-full lg:w-auto">
                <div className="rounded-4xl bg-white/60 p-4 shadow-xl shadow-cusblue/5 backdrop-blur-md border border-white/40 overflow-hidden flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={
                                isSelectionActive
                                    ? handleClearSelection
                                    : handleStartSelection
                            }
                            className={
                                "rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition-all border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }>
                            {isSelectionActive
                                ? "Unselect Media"
                                : "Select Media"}
                        </button>

                        <MediaUploadButton
                            eventId={eventId}
                            eventEndTime={event?.endTime}
                            onUploadSuccess={(hasVideos) => {
                                // Images arrive via new_media socket so no refetch needed.
                                // Videos are queued; socket fires once FFmpeg finishes.
                                // Either way, no immediate refetch required.
                                if (hasVideos) void fetchGallery();
                            }}
                        />

                        <button
                            type="button"
                            onClick={handleDownloadMedia}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50">
                            Download All
                        </button>
                    </div>

                    {isSelectionActive && (
                        <SelectionActionBar
                            selectedCount={selectedIds.length}
                            totalCount={gallery.length}
                            onDownload={handleDownloadMedia}
                            onDelete={handleConfirmBulkDelete}
                            isUser={isHost}
                        />
                    )}
                </div>
            </div>

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
                <GalleryGrid
                    mediaItems={gallery}
                    isHost={isHost}
                    currentUserId={currentUserId}
                    isSelectionActive={isSelectionActive}
                    selectedIds={selectedIds}
                    onSelectionToggle={handleSelectToggle}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    userExists={Boolean(user)}
                />
            )}
        </div>
    );
};

export default GalleryPage;
