"use client";

import React from "react";
import type { Media } from "@/types/Media";
import Image from "next/image";
import { Heart } from "lucide-react";
import DeleteMediaConfirmButton from "@/components/media/DeleteMediaConfirmButton";

interface MediaCardProps {
    media: Media;
    isHost: boolean;
    currentUserId: string;
    onDelete?: (mediaId: string) => void;
    onLike?: (mediaId: string) => void;
    disableLike?: boolean;
    isSelected?: boolean;
    isSelectMode?: boolean;
    onSelectToggle?: (mediaId: string) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
    media,
    isHost,
    currentUserId,
    onDelete,
    onLike,
    disableLike,
    isSelected = false,
    isSelectMode = false,
    onSelectToggle,
}) => {
    const isUploader = media.uploaderId?._id === currentUserId;
    const canDelete = isHost || isUploader;
    const isLiked = media.likedBy?.includes(currentUserId);
    const displayName =
        media.uploaderId?.userName || media.guestId?.userName || "Guest";

    const handleCardClick = () => {
        if (!isSelectMode) return;
        onSelectToggle?.(media._id);
    };

    return (
        <div
            className={`group relative flex flex-col overflow-hidden rounded-4xl bg-white border shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
                isSelectMode ? "cursor-pointer" : ""
            } ${isSelected ? "border-cusblue ring-2 ring-cusblue/40" : "border-slate-100"}`}
            onClick={handleCardClick}>
            {/* Media Container */}
            <div className="relative h-72 w-full overflow-hidden bg-slate-100">
                {["photo", "image"].includes(media.mediaType?.toLowerCase()) ? (
                    <Image
                        src={media.mediaUrl}
                        alt={media.label || "Event media"}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <video
                        src={media.mediaUrl}
                        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        muted
                        loop
                        onMouseOver={(e) => e.currentTarget.play()}
                        onMouseOut={(e) => e.currentTarget.pause()}
                    />
                )}

                {isSelectMode && (
                    <div className="pointer-events-none absolute inset-0 bg-cusblue/10" />
                )}

                {isSelectMode && (
                    <div className="absolute top-4 right-4">
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-black transition-colors ${
                                isSelected
                                    ? "border-cusblue bg-cusblue text-white"
                                    : "border-white/80 bg-black/20 text-transparent"
                            }`}>
                            ✓
                        </span>
                    </div>
                )}

                {/* Aesthetic Label Overlay */}
                {media.label && (
                    <div className="absolute top-4 left-4">
                        <span className="backdrop-blur-xl bg-black/30 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border border-white/20">
                            {media.label}
                        </span>
                    </div>
                )}

                {/* Delete Button - Smooth fade & slide */}
                {canDelete && !isSelectMode && (
                    <div className="absolute top-4 right-4 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                        <DeleteMediaConfirmButton
                            mediaId={media._id}
                            onConfirm={onDelete}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Bar */}
            <div className="flex items-center justify-between p-5 bg-linear-to-b from-transparent to-white">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Contributor
                    </span>
                    <span className="text-sm font-extrabold text-slate-800 tracking-tight">
                        {displayName}
                    </span>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onLike?.(media._id);
                    }}
                    disabled={disableLike || isSelectMode}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 active:scale-90 ${
                        isLiked
                            ? "bg-rose-50 text-rose-500 shadow-inner"
                            : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    } ${isSelectMode ? "opacity-60 cursor-not-allowed" : ""}`}>
                    <Heart
                        className={`h-5 w-5 transition-transform duration-300 ${isLiked ? "fill-current scale-110" : ""}`}
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
