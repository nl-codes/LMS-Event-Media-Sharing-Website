import { useEffect } from "react";
import { getSocket } from "@/config/socket";
import type { Media } from "@/types/Media";

interface UseGallerySocketProps {
    eventId: string;
    onNewMedia: (media: Media) => void;
    onMediaDeleted: (mediaId: string) => void;
    onMediaLiked: (data: { mediaId: string; likesCount: number }) => void;
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
    useEffect(() => {
        if (!eventId) return;

        const socket = getSocket();

        if (!socket.connected) {
            socket.connect();
        }

        socket.emit("join_gallery", eventId);

        const handleDeleted = ({ mediaId }: { mediaId: string }) => {
            onMediaDeleted(mediaId);
        };

        const handleNewMedia = (media: IncomingSocketMedia) => {
            onNewMedia(normalizeIncomingMedia(media));
        };

        socket.on("new_media", handleNewMedia);
        socket.on("media_deleted", handleDeleted);
        socket.on("media_liked", onMediaLiked);

        return () => {
            socket.emit("leave_gallery", eventId);
            socket.off("new_media", handleNewMedia);
            socket.off("media_deleted", handleDeleted);
            socket.off("media_liked", onMediaLiked);
            socket.disconnect();
        };
    }, [eventId, onNewMedia, onMediaDeleted, onMediaLiked]);
};
