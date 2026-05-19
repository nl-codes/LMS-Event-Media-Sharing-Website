import { useEffect, useRef } from "react";
import { getSocket } from "@/config/socket";
import type { Media } from "@/types/Media";

interface UseGallerySocketProps {
    eventId: string;
    onNewMedia: (media: Media) => void;
    onMediaDeleted: (mediaId: string) => void;
    onMediaLiked: (data: {
        mediaId: string;
        likesCount: number;
        userId: string;
        liked?: boolean;
    }) => void;
}

type IncomingSocketMedia = Media & {
    uploader?: {
        _id: string;
        name: string;
    };
};

function normalizeIncomingMedia(media: IncomingSocketMedia): Media {
    const normalizedUploaderId =
        media.uploaderId && typeof media.uploaderId === "object"
            ? media.uploaderId
            : media.uploader
              ? {
                    _id: media.uploader._id,
                    userName: media.uploader.name,
                }
              : undefined;

    return {
        ...media,
        uploaderId: normalizedUploaderId,
        guestId:
            media.guestId && typeof media.guestId === "object"
                ? media.guestId
                : undefined,
    };
}

export const useGallerySocket = ({
    eventId,
    onNewMedia,
    onMediaDeleted,
    onMediaLiked,
}: UseGallerySocketProps) => {
    // Keep stable refs to the latest callbacks so the socket handlers never go stale without needing to be re-registered.
    const onNewMediaRef = useRef(onNewMedia);
    const onMediaDeletedRef = useRef(onMediaDeleted);
    const onMediaLikedRef = useRef(onMediaLiked);

    useEffect(() => {
        onNewMediaRef.current = onNewMedia;
    }, [onNewMedia]);

    useEffect(() => {
        onMediaDeletedRef.current = onMediaDeleted;
    }, [onMediaDeleted]);

    useEffect(() => {
        onMediaLikedRef.current = onMediaLiked;
    }, [onMediaLiked]);

    // Only runs when eventId changes i.e. joining/leaving the room. Callback identity changes never cause reconnects.
    useEffect(() => {
        if (!eventId) return;

        const socket = getSocket();

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit("join_gallery", eventId);

        const handleNewMedia = (media: IncomingSocketMedia) => {
            onNewMediaRef.current(normalizeIncomingMedia(media));
        };

        const handleDeleted = ({ mediaId }: { mediaId: string }) => {
            onMediaDeletedRef.current(mediaId);
        };

        const handleLiked = (data: {
            mediaId: string;
            likesCount: number;
            userId: string;
            liked?: boolean;
        }) => {
            onMediaLikedRef.current(data);
        };

        socket.on("new_media", handleNewMedia);
        socket.on("media_deleted", handleDeleted);
        socket.on("media_liked", handleLiked);

        return () => {
            socket.emit("leave_gallery", eventId);
            socket.off("new_media", handleNewMedia);
            socket.off("media_deleted", handleDeleted);
            socket.off("media_liked", handleLiked);
            // Do NOT call socket.disconnect() here — the socket is a shared
            // singleton and may be used by chat or other hooks on the same page.
        };
    }, [eventId]);
};
