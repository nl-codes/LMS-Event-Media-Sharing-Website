"use client";

import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useGallerySocket } from "@/hooks/useGallerySocket";
import { deleteMedia, toggleLike, updateMediaHighlight } from "@/lib/mediaApi";
import {
    normalizeLikedByIds,
    normalizeMediaLikes,
} from "@/utils/HelperFunctions";
import type { Media } from "@/types/Media";

interface UseGalleryStateOpts {
    eventId: string;
    currentUserId: string;
    /** If false, the like button still optimistically updates is skipped. */
    canLike: boolean;
    /** Called when a socket-delivered delete needs the parent to update other state (e.g. clear from selection). */
    onMediaDeleted?: (mediaId: string) => void;
}

// Owns the gallery list + the wire-up between socket events, like toggling
// (optimistic + rollback), and single-item delete. Both gallery pages share
// this; their only differences are what they do after — selection cleanup,
// host checks — which they handle locally.
export function useGalleryState({
    eventId,
    currentUserId,
    canLike,
    onMediaDeleted,
}: UseGalleryStateOpts) {
    const [gallery, setGallery] = useState<Media[]>([]);

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
            onMediaDeleted?.(mediaId);
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

    const handleDelete = useCallback(async (mediaId: string) => {
        try {
            await deleteMedia(mediaId);
            toast.success("Media deleted");
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed");
        }
    }, []);

    const handleLike = useCallback(
        async (mediaId: string) => {
            if (!canLike) return;

            // Snapshot for rollback. setGallery callback returns prev so we
            // can capture without an extra render dependency.
            let snapshot: Media[] = [];
            setGallery((prev) => {
                snapshot = prev;
                return prev.map((media) => {
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
                });
            });

            try {
                const result = await toggleLike(mediaId);
                setGallery((prev) =>
                    prev.map((media) =>
                        media._id === mediaId
                            ? { ...media, likesCount: result.likesCount }
                            : media,
                    ),
                );
            } catch (err) {
                setGallery(snapshot);
                toast.error(err instanceof Error ? err.message : "Like failed");
            }
        },
        [canLike, currentUserId],
    );

    const handleToggleHighlight = useCallback(
        async (mediaId: string, nextIsHighlight: boolean) => {
            // Optimistic: flip the local flag now so the badge appears/disappears
            // immediately. Capture a snapshot for rollback.
            let snapshot: Media[] = [];
            setGallery((prev) => {
                snapshot = prev;
                return prev.map((m) =>
                    m._id === mediaId
                        ? { ...m, isHighlight: nextIsHighlight }
                        : m,
                );
            });

            try {
                await updateMediaHighlight(mediaId, nextIsHighlight);
            } catch (err) {
                setGallery(snapshot);
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Failed to update highlight",
                );
            }
        },
        [],
    );

    return {
        gallery,
        setGallery,
        handleDelete,
        handleLike,
        handleToggleHighlight,
    };
}
