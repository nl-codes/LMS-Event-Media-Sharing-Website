"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useLikeToggle } from "@/hooks/useLikeToggle";
import { useUser } from "@/context/UserContext";
import { normalizeLikedByIds } from "@/utils/HelperFunctions";
import type { Media } from "@/types/Media";

interface ExploreMediaCardProps {
    media: Media;
    onLikeChange?: (
        mediaId: string,
        liked: boolean,
        likesCount: number,
    ) => void;
}

export default function ExploreMediaCard({
    media,
    onLikeChange,
}: ExploreMediaCardProps) {
    const router = useRouter();
    const { user } = useUser();
    const currentUserId = user?._id || "";

    const initialLiked =
        !!currentUserId &&
        normalizeLikedByIds(media.likedBy).includes(currentUserId);

    const { isLiked, likesCount, toggle } = useLikeToggle(
        media._id,
        initialLiked,
        media.likesCount ?? 0,
        {
            canLike: !!user,
            onSuccess: ({ liked, likesCount: nextCount }) => {
                onLikeChange?.(media._id, liked, nextCount);
            },
        },
    );

    const handleNavigate = () => {
        router.push(`/media/${media._id}`);
    };

    const isVideo = media.mediaType === "video";

    return (
        <article className="mb-4 break-inside-avoid rounded-2xl bg-white shadow-sm ring-1 ring-cusblue/10 overflow-hidden">
            <button
                type="button"
                onClick={handleNavigate}
                className="block w-full text-left">
                <div className="relative w-full bg-slate-100">
                    {isVideo ? (
                        <video
                            src={media.mediaUrl}
                            className="w-full h-auto block"
                            preload="metadata"
                            muted
                            playsInline
                        />
                    ) : (
                        <Image
                            src={media.mediaUrl}
                            alt={media.label || "Event media"}
                            width={800}
                            height={800}
                            sizes="(max-width: 640px) 100vw, 50vw"
                            className="w-full h-auto block"
                            unoptimized
                        />
                    )}
                </div>
            </button>

            <div className="flex items-center justify-between px-3 py-2">
                {media.eventId &&
                    typeof media.eventId === "object" &&
                    media.eventId.eventName && (
                        <p className="truncate text-xs text-cusviolet/60">
                            {media.eventId.eventName}
                        </p>
                    )}
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        void toggle();
                    }}
                    className="flex items-center gap-1.5 text-sm font-bold text-cusblue transition-colors hover:text-rose-500"
                    aria-label={isLiked ? "Unlike" : "Like"}>
                    <Heart
                        className={`h-5 w-5 transition-colors ${
                            isLiked
                                ? "fill-rose-500 text-rose-500"
                                : "text-cusviolet/70"
                        }`}
                    />
                    <span>{likesCount}</span>
                </button>
            </div>
        </article>
    );
}
