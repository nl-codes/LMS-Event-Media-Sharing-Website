"use client"; // Ensure this is the very first line

import { useEffect, useState, useCallback } from "react";
import { getGallery, deleteMedia, toggleLike } from "@/lib/mediaApi";
import type { Media } from "@/types/Media";
import MediaCard from "@/components/media/MediaCard";
import MediaUploadButton from "@/components/media/MediaUploadButton";
import HighlightsGrid from "@/components/media/HighlightsGrid";
import { useUser } from "@/context/UserContext";
import toast from "react-hot-toast";
import { useParams } from "next/navigation";
import { useGallerySocket } from "@/hooks/useGallerySocket";

const GalleryPage = () => {
    const params = useParams();
    const eventId = typeof params?.id === "string" ? params.id : "";
    const { user } = useUser();
    const [gallery, setGallery] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);

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

    const fetchGallery = useCallback(async () => {
        try {
            const data = await getGallery(eventId);
            setGallery(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Failed to load gallery";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        if (!user) return;

        fetchGallery();
    }, [user, fetchGallery]);

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

    const handleLike = async (mediaId: string) => {
        try {
            await toggleLike(mediaId);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Like failed";
            toast.error(errorMessage);
        }
    };

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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default GalleryPage;
