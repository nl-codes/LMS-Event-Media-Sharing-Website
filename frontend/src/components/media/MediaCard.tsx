"use client";

import React from "react";
import type { Media } from "@/types/Media";
import Image from "next/image";
import { Heart, Trash2Icon } from "lucide-react";

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
    const isLiked = media.likedBy?.includes(currentUserId);
    const displayName =
        media.uploaderId?.userName || media.guestId?.userName || "Guest";

    return (
        <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {/* Media Container */}
            <div className="relative h-64 w-full overflow-hidden bg-slate-100">
                {media.mediaType === "photo" ? (
                    <Image
                        src={media.mediaUrl}
                        alt={media.label || "Event media"}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                ) : (
                    <video
                        src={media.mediaUrl}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        muted
                        loop
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => e.currentTarget.pause()}
                    />
                )}

                {/* Aesthetic Label Overlay */}
                {media.label && (
                    <div className="absolute top-3 left-3">
                        <span className="backdrop-blur-md bg-white/70 text-slate-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-sm border border-white/50">
                            {media.label}
                        </span>
                    </div>
                )}

                {/* Action Overlay (Visible on Hover) */}
                {canDelete && (
                    <div className="absolute top-3 right-3 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <button
                            onClick={() => onDelete?.(media._id)}
                            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-400 backdrop-blur-sm transition-colors hover:bg-red-500 hover:text-white shadow-lg"
                            title="Delete Media">
                            <Trash2Icon className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex items-center justify-between p-4">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-tight text-slate-400">
                        Uploaded by
                    </span>
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[120px]">
                        {displayName}
                    </span>
                </div>

                {/* Like Button Component */}
                <button
                    onClick={() => onLike?.(media._id)}
                    disabled={disableLike}
                    className={`
                        relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 active:scale-95
                        ${
                            isLiked
                                ? "bg-rose-50 text-rose-500 shadow-sm"
                                : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                    `}>
                    <Heart
                        className={`h-5 w-5 transition-all duration-300 ${isLiked ? "fill-current scale-110" : "fill-none"}`}
                        strokeWidth={2.5}
                    />
                    <span className="text-xs font-black">
                        {media.likesCount || 0}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default MediaCard;
