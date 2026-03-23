"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { getEventBySlug } from "@/lib/eventApi";
import { getGallery, deleteMedia, toggleLike } from "@/lib/mediaApi";
import { useGallerySocket } from "@/hooks/useGallerySocket";
import MediaCard from "@/components/media/MediaCard";
import MediaUploadButton from "@/components/media/MediaUploadButton";
import HighlightsGrid from "@/components/media/HighlightsGrid";
import type { Media } from "@/types/Media";

export default function EventPublicGallery() {
    const params = useParams();
    const slug = typeof params?.slug === "string" ? params.slug : "";
    const { user } = useUser();

    const [eventId, setEventId] = useState("");
    const [gallery, setGallery] = useState<Media[]>([]);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [loadingGallery, setLoadingGallery] = useState(false);

    const isHost = user?.role === "host";
    const currentUserId = user?._id || "";

    useGallerySocket({
        eventId,
        onNewMedia: (media) => {
            setGallery((prev) =>
                prev.find((m) => m._id === media._id) ? prev : [media, ...prev],
            );
        },
        onMediaDeleted: (mediaId) => {
            setGallery((prev) => prev.filter((m) => m._id !== mediaId));
        },
        onMediaLiked: ({ mediaId, likesCount }) => {
            setGallery((prev) =>
                prev.map((m) => (m._id === mediaId ? { ...m, likesCount } : m)),
            );
        },
    });

    const fetchGallery = useCallback(async (resolvedEventId: string) => {
        setLoadingGallery(true);
        try {
            const data = await getGallery(resolvedEventId);
            setGallery(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load gallery";
            toast.error(errorMessage);
        } finally {
            setLoadingGallery(false);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function resolveEventAndLoadGallery() {
            if (!slug) {
                if (isMounted) {
                    setLoadingEvent(false);
                }
                return;
            }

            setLoadingEvent(true);
            try {
                const event = await getEventBySlug(slug);

                if (!event?._id) {
                    throw new Error("Event not found");
                }

                if (!isMounted) return;

                setEventId(event._id);
                await fetchGallery(event._id);
            } catch (err) {
                if (isMounted) {
                    setEventId("");
                    setGallery([]);
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : "Failed to load event";
                    toast.error(errorMessage);
                }
            } finally {
                if (isMounted) {
                    setLoadingEvent(false);
                }
            }
        }

        resolveEventAndLoadGallery();

        return () => {
            isMounted = false;
        };
    }, [slug, fetchGallery]);

    const handleDelete = async (mediaId: string) => {
        if (!user) return;

        try {
            await deleteMedia(mediaId);
            toast.success("Media deleted");
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Delete failed";
            toast.error(errorMessage);
        }
    };

    const handleLike = async (mediaId: string) => {
        if (!user) return;

        try {
            await toggleLike(mediaId);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Like failed";
            toast.error(errorMessage);
        }
    };

    if (loadingEvent) {
        return <div className="py-10 text-center">Loading event...</div>;
    }

    if (!eventId) {
        return (
            <div className="p-8 text-center text-gray-600">
                Event not found or unavailable.
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Event Gallery</h1>

            <div className="mb-4 flex justify-between items-center">
                <MediaUploadButton
                    eventId={eventId}
                    onUploadSuccess={() => {}}
                />
            </div>

            <HighlightsGrid
                eventId={eventId}
                isHost={Boolean(user) ? isHost : false}
                currentUserId={Boolean(user) ? currentUserId : ""}
            />

            <h2 className="text-xl font-semibold mt-8 mb-2">All Media</h2>

            {loadingGallery ? (
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
                            isHost={Boolean(user) ? isHost : false}
                            currentUserId={Boolean(user) ? currentUserId : ""}
                            onDelete={handleDelete}
                            onLike={handleLike}
                            disableLike={!user}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
