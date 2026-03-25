"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { useIdentity } from "@/context/IdentityContext";
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
    const { displayName } = useIdentity();

    const [eventId, setEventId] = useState("");
    const [eventName, setEventName] = useState("Event Gallery");
    const [gallery, setGallery] = useState<Media[]>([]);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [loadingGallery, setLoadingGallery] = useState(false);

    const isHost = user?.role === "host";
    const currentUserId = user?._id || "";
    const scopedGuestDisplayName =
        typeof document !== "undefined" && slug
            ? (() => {
                  const cookieValue = document.cookie
                      .split("; ")
                      .find((row) => row.startsWith(`guest_${slug}=`))
                      ?.split("=")[1];
                  if (!cookieValue) return null;
                  try {
                      const parsed = JSON.parse(
                          decodeURIComponent(cookieValue),
                      ) as {
                          userName?: string;
                      };
                      return parsed.userName || null;
                  } catch {
                      return null;
                  }
              })()
            : null;
    const uploaderDisplayName =
        user?.userName || scopedGuestDisplayName || displayName;

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
                setEventName(event.eventName || "Event Gallery");
                await fetchGallery(event._id);
            } catch (err) {
                if (isMounted) {
                    setEventId("");
                    setEventName("Event Gallery");
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

        const previousGallery = gallery;
        setGallery((prev) =>
            prev.map((media) => {
                if (media._id !== mediaId) return media;

                const likedBy = Array.isArray(media.likedBy)
                    ? media.likedBy
                    : [];
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
            <h1 className="text-3xl font-bold mb-1 text-cusblue">
                {eventName}
            </h1>
            <p className="text-sm text-cusviolet/80 mb-4">
                Shared Event Gallery
            </p>

            <div className="mb-4 flex justify-between items-center">
                <div>
                    <MediaUploadButton
                        eventId={eventId}
                        eventSlug={slug}
                        onUploadSuccess={() => {
                            void fetchGallery(eventId);
                        }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Uploading as {uploaderDisplayName}
                    </p>
                </div>
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
