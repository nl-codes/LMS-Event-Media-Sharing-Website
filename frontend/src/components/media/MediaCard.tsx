import React from "react";
import type { Media } from "@/types/Media";
import Image from "next/image";

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
                <span className="text-sm text-gray-700">
                    {media.uploaderId?.userName ||
                        media.guestId?.userName ||
                        "Guest"}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        className={`text-red-500 hover:text-red-700 transition disabled:opacity-50 flex items-center`}
                        onClick={() => onLike && onLike(media._id)}
                        disabled={disableLike}
                        aria-label="Like">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill={liked ? "#ef4444" : "none"}
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M21 8.25c0-2.485-2.239-4.5-5-4.5-1.657 0-3.156.832-4 2.086A4.978 4.978 0 0 0 7 3.75c-2.761 0-5 2.015-5 4.5 0 7.25 10 11 10 11s10-3.75 10-11z"
                            />
                        </svg>
                        <span className="ml-1 text-xs">{media.likesCount}</span>
                    </button>
                    {canDelete && (
                        <button
                            className="text-gray-400 hover:text-red-600 transition"
                            onClick={() => onDelete && onDelete(media._id)}
                            aria-label="Delete">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
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
