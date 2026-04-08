"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { useIdentity } from "@/context/IdentityContext";
import { getEventBySlug } from "@/lib/eventApi";
import { getGallery, toggleLike } from "@/lib/mediaApi";
import { useGallerySocket } from "@/hooks/useGallerySocket";
import MediaUploadButton from "@/components/media/MediaUploadButton";
import HighlightsGrid from "@/components/media/HighlightsGrid";
import GalleryEventHeader from "@/components/events/GalleryEventHeader";
import GalleryGrid from "@/components/events/GalleryGrid";
import SelectionActionBar from "@/components/events/SelectionActionBar";
import ChatContainer from "@/components/chat/ChatContainer";
import type { Media } from "@/types/Media";
import type { Event } from "@/types/Event";
import BackButton from "@/components/navigation/BackButton";
import {
    downloadAsZip,
    normalizeLikedByIds,
    normalizeMediaLikes,
} from "@/utils/HelperFunctions";

const MAX_SELECTION_ITEMS = 20;

export default function EventPublicGallery() {
    const params = useParams();
    const slug = typeof params?.slug === "string" ? params.slug : "";
    const { user } = useUser();
    const { displayName } = useIdentity();

    const [eventId, setEventId] = useState("");
    const [event, setEvent] = useState<Event | null>(null);
    const [gallery, setGallery] = useState<Media[]>([]);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [loadingGallery, setLoadingGallery] = useState(false);
    const [isSelectionActive, setIsSelectionActive] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [hostName, setHostName] = useState("");
    const isHost = event?.hostId === eventId;
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
                prev.find((m) => m._id === media._id)
                    ? prev
                    : [normalizeMediaLikes(media), ...prev],
            );
        },
        onMediaDeleted: (mediaId) => {
            setGallery((prev) => prev.filter((m) => m._id !== mediaId));
            setSelectedIds((prev) => prev.filter((id) => id !== mediaId));
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
            setGallery(data.map(normalizeMediaLikes));
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
                setEvent(event);
                if (event.hostId && typeof event.hostId === "object") {
                    setHostName(event.hostId.userName || "");
                }
                await fetchGallery(event._id);
            } catch (err) {
                if (isMounted) {
                    setEventId("");
                    setEvent(null);
                    setGallery([]);
                    setSelectedIds([]);
                    setIsSelectionActive(false);
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

    const handleDelete = () => {
        // Guest gallery intentionally has no destructive action.
    };

    const handleStartSelection = () => {
        setIsSelectionActive(true);
    };

    const handleClearSelection = () => {
        setSelectedIds([]);
        setIsSelectionActive(false);
    };

    const handleSelectToggle = (mediaId: string) => {
        if (!isSelectionActive) return;

        setSelectedIds((prev) => {
            if (prev.includes(mediaId)) {
                return prev.filter((id) => id !== mediaId);
            }

            if (prev.length >= MAX_SELECTION_ITEMS) {
                toast.error("You can select up to 20 items only");
                return prev;
            }

            return [...prev, mediaId];
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
        if (!user) return;

        const previousGallery = gallery;
        setGallery((prev) =>
            prev.map((media) => {
                if (media._id !== mediaId) return media;

                const likedBy = Array.isArray(media.likedBy)
                    ? normalizeLikedByIds(media.likedBy)
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
        <div className="max-w-5xl mx-auto p-4 relative min-h-screen">
            <div className="mb-4 flex flex-row items-center gap-4">
                <BackButton
                    href={`/events/${slug}`}
                    label="Back to Event"
                    replace={true}
                />
            </div>

            {event && (
                <GalleryEventHeader
                    event={event}
                    subtitle="Shared Event Gallery"
                    roleBadge={`${hostName}'s Event`}
                />
            )}

            <HighlightsGrid
                eventId={eventId}
                isHost={Boolean(user) ? isHost : false}
                currentUserId={Boolean(user) ? currentUserId : ""}
            />

            <div className="w-full lg:w-auto">
                <div className="rounded-4xl border border-white/40 bg-white/60 p-4 shadow-xl shadow-cusblue/5 backdrop-blur-md">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={
                                    isSelectionActive
                                        ? handleClearSelection
                                        : handleStartSelection
                                }
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
                                {isSelectionActive
                                    ? "Unselect Media"
                                    : "Select Media"}
                            </button>

                            <MediaUploadButton
                                eventId={eventId}
                                eventSlug={slug}
                                onUploadSuccess={() => {
                                    void fetchGallery(eventId);
                                }}
                            />

                            <button
                                type="button"
                                onClick={handleDownloadMedia}
                                disabled={!gallery.length}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                                Download All
                            </button>
                        </div>

                        {isSelectionActive && (
                            <SelectionActionBar
                                selectedCount={selectedIds.length}
                                totalCount={gallery.length}
                                onDownload={handleDownloadMedia}
                                isHost={false}
                            />
                        )}

                        <p className="text-xs text-cusviolet/70">
                            Uploading as {uploaderDisplayName}
                        </p>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-semibold mt-8 mb-2">All Media</h2>

            {loadingGallery ? (
                <div className="py-10 text-center">Loading gallery...</div>
            ) : !gallery.length ? (
                <div className="py-10 text-center text-gray-500">
                    No media uploaded yet.
                </div>
            ) : (
                <GalleryGrid
                    mediaItems={gallery}
                    isHost={false}
                    currentUserId={Boolean(user) ? currentUserId : ""}
                    isSelectionActive={isSelectionActive}
                    selectedIds={selectedIds}
                    onSelectionToggle={handleSelectToggle}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    userExists={Boolean(user)}
                />
            )}

            {/* Chat Section */}

            {/* Floating Chat Component */}
            {event && (
                <ChatContainer
                    eventId={eventId}
                    eventName={event.eventName || "Event"}
                />
            )}
        </div>
    );
}
