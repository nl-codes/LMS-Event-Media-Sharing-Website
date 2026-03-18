import { useEffect } from "react";
import { getSocket } from "@/config/socket";
import type { Media } from "@/types/Media";

interface UseGallerySocketProps {
    eventId: string;
    onNewMedia: (media: Media) => void;
    onMediaDeleted: (mediaId: string) => void;
    onMediaLiked: (data: { mediaId: string; likesCount: number }) => void;
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

        socket.on("new_media", onNewMedia);
        socket.on("media_deleted", handleDeleted);
        socket.on("media_liked", onMediaLiked);

        return () => {
            socket.emit("leave_gallery", eventId);
            socket.off("new_media", onNewMedia);
            socket.off("media_deleted", handleDeleted);
            socket.off("media_liked", onMediaLiked);
            socket.disconnect();
        };
    }, [eventId, onNewMedia, onMediaDeleted, onMediaLiked]);
};
