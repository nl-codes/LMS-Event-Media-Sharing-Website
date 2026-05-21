"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Clock, Heart, Trophy } from "lucide-react";
import UserAvatar from "@/components/common/UserAvatar";
import { isImageMedia } from "@/utils/HelperFunctions";
import type { Media } from "@/types/Media";

interface GalleryAwardsProps {
    mediaItems: Media[];
}

type Winner = {
    id: string;
    name: string;
    avatarSrc?: string;
    isGuest: boolean;
};

const getUploader = (media: Media): Winner | null => {
    if (media.uploaderId?._id) {
        return {
            id: media.uploaderId._id,
            name: media.uploaderId.userName || "Member",
            avatarSrc: media.uploaderId.profilePicture,
            isGuest: false,
        };
    }
    if (media.guestId?._id) {
        return {
            id: media.guestId._id,
            name: media.guestId.userName || "Guest",
            isGuest: true,
        };
    }
    return null;
};

export default function GalleryAwards({ mediaItems }: GalleryAwardsProps) {
    const { mostLikedPhoto, mostCaptures, firstCapture } = useMemo(() => {
        let topPhoto: Media | null = null;
        let earliest: Media | null = null;
        const counts = new Map<string, { uploader: Winner; count: number }>();

        for (const media of mediaItems) {
            // Most liked photo: images only, strictly positive likes so the
            // award means something. Ties broken by createdAt (newest wins).
            if (isImageMedia(media.mediaType) && (media.likesCount || 0) > 0) {
                if (
                    !topPhoto ||
                    (media.likesCount || 0) > (topPhoto.likesCount || 0) ||
                    ((media.likesCount || 0) === (topPhoto.likesCount || 0) &&
                        new Date(media.createdAt).getTime() >
                            new Date(topPhoto.createdAt).getTime())
                ) {
                    topPhoto = media;
                }
            }

            // First capture: earliest createdAt across the whole set.
            if (
                !earliest ||
                new Date(media.createdAt).getTime() <
                    new Date(earliest.createdAt).getTime()
            ) {
                earliest = media;
            }

            // Most captures: group by uploader/guest.
            const uploader = getUploader(media);
            if (uploader) {
                const existing = counts.get(uploader.id);
                if (existing) {
                    existing.count += 1;
                } else {
                    counts.set(uploader.id, { uploader, count: 1 });
                }
            }
        }

        let topCaptures: { uploader: Winner; count: number } | null = null;
        for (const entry of counts.values()) {
            if (!topCaptures || entry.count > topCaptures.count) {
                topCaptures = entry;
            }
        }

        return {
            mostLikedPhoto: topPhoto,
            mostCaptures: topCaptures,
            firstCapture: earliest,
        };
    }, [mediaItems]);

    // Don't render anything if nothing qualifies.
    if (!mostLikedPhoto && !mostCaptures && !firstCapture) return null;

    return (
        <section className="rounded-3xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-md sm:p-5">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 shadow-sm">
                <Trophy className="h-3.5 w-3.5 fill-current" />
                Engagement awards
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mostLikedPhoto && (
                    <MostLikedPhotoCard media={mostLikedPhoto} />
                )}
                {mostCaptures && (
                    <MostCapturesCard
                        winner={mostCaptures.uploader}
                        count={mostCaptures.count}
                    />
                )}
                {firstCapture && <FirstCaptureCard media={firstCapture} />}
            </div>
        </section>
    );
}

function AwardCardShell({
    icon,
    label,
    children,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
    onClick?: () => void;
}) {
    const interactive = !!onClick;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={!interactive}
            className={`flex w-full items-center gap-3 rounded-2xl border border-cusblue/10 bg-white/80 p-3 text-left transition ${
                interactive
                    ? "cursor-pointer hover:bg-white hover:shadow-md"
                    : "cursor-default"
            }`}>
            {icon}
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cusviolet/70">
                    {label}
                </p>
                {children}
            </div>
        </button>
    );
}

function MostLikedPhotoCard({ media }: { media: Media }) {
    const router = useRouter();
    const uploaderName =
        media.uploaderId?.userName || media.guestId?.userName || "Unknown";

    return (
        <AwardCardShell
            icon={
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    <Image
                        src={media.mediaUrl}
                        alt={media.label || "Most liked photo"}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                    />
                </div>
            }
            label="Most Liked Photo"
            onClick={() => router.push(`/media/${media._id}`)}>
            <div className="mt-1 flex items-center gap-1.5 text-sm font-extrabold text-cusblue">
                <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
                {media.likesCount} {media.likesCount === 1 ? "like" : "likes"}
            </div>
            <p className="truncate text-xs text-cusviolet/70">
                by {uploaderName}
            </p>
        </AwardCardShell>
    );
}

function MostCapturesCard({
    winner,
    count,
}: {
    winner: Winner;
    count: number;
}) {
    const router = useRouter();
    // Only registered users get a profile page; guests have no public route.
    const onClick = winner.isGuest
        ? undefined
        : () => router.push(`/home/profile/${winner.id}/others`);

    return (
        <AwardCardShell
            icon={
                <div className="shrink-0">
                    <UserAvatar
                        src={winner.avatarSrc}
                        name={winner.name}
                        size="medium"
                    />
                </div>
            }
            label="Most Captures"
            onClick={onClick}>
            <p className="truncate text-sm font-extrabold text-cusblue">
                {winner.name}
                {winner.isGuest && (
                    <span className="ml-2 rounded-full bg-cusviolet/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-cusviolet">
                        Guest
                    </span>
                )}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-cusviolet/70">
                <Camera className="h-3.5 w-3.5" />
                {count} {count === 1 ? "upload" : "uploads"}
            </p>
        </AwardCardShell>
    );
}

function FirstCaptureCard({ media }: { media: Media }) {
    const router = useRouter();
    const uploaderName =
        media.uploaderId?.userName || media.guestId?.userName || "Unknown";
    const when = new Date(media.createdAt).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <AwardCardShell
            icon={
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {isImageMedia(media.mediaType) ? (
                        <Image
                            src={media.mediaUrl}
                            alt={media.label || "First capture"}
                            fill
                            sizes="56px"
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-cusviolet/60">
                            <Clock className="h-5 w-5" />
                        </div>
                    )}
                </div>
            }
            label="First Capture"
            onClick={() => router.push(`/media/${media._id}`)}>
            <p className="truncate text-sm font-extrabold text-cusblue">
                {when}
            </p>
            <p className="truncate text-xs text-cusviolet/70">
                by {uploaderName}
            </p>
        </AwardCardShell>
    );
}
