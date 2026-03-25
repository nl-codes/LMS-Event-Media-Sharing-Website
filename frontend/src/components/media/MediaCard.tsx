import React from "react";
import type { Media } from "@/types/Media";
import Image from "next/image";
import { Heart, Trash2Icon } from "lucide-react";
import Button from "@/components/buttons/Button";

interface MediaCardProps {
    media: Media;
    isHost: boolean;
    currentUserId: string;
    onDelete?: (mediaId: string) => void;
    onLike?: (mediaId: string) => void;
    disableLike?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({
    media,
    isHost,
    currentUserId,
    onDelete,
    onLike,
    disableLike,
}) => {
    const isUploader = media.uploaderId?._id === currentUserId;
    const canDelete = isHost || isUploader;
    const liked = media.likedBy?.includes(currentUserId);
    const displayName =
        media.uploaderId?.userName || media.guestId?.userName || "Guest";

    return (
        <div className="bg-white rounded shadow p-2 flex flex-col relative group">
            {media.mediaType === "photo" ? (
                <Image
                    src={media.mediaUrl}
                    alt={media.label || "Event media"}
                    width={400}
                    height={300}
                    className="object-cover w-full h-48 rounded"
                />
            ) : (
                <video
                    src={media.mediaUrl}
                    controls
                    className="object-cover w-full h-48 rounded"
                />
            )}
            <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-gray-700">{displayName}</span>
                <div className="flex items-center gap-2">
                    <Button
                        className="bg-transparent p-0 hover:bg-transparent text-red-500 hover:text-red-700 disabled:opacity-50"
                        handleClick={() => onLike && onLike(media._id)}
                        disabled={disableLike}
                        aria-label="Like">
                        <Heart
                            className="w-5 h-5"
                            fill={liked ? "currentColor" : "none"}
                            strokeWidth={1.8}
                        />
                        <span className="ml-1 text-xs">{media.likesCount}</span>
                    </Button>
                    {canDelete && (
                        <Button
                            className="bg-transparent p-0 hover:bg-transparent text-gray-400 hover:text-red-600"
                            handleClick={() => onDelete && onDelete(media._id)}
                            aria-label="Delete">
                            <Trash2Icon className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>
            {media.label && (
                <span className="absolute top-2 left-2 bg-yellow-400 text-xs px-2 py-1 rounded shadow">
                    {media.label}
                </span>
            )}
        </div>
    );
};

export default MediaCard;
