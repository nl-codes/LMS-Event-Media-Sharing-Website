import React, { useCallback, useEffect, useRef, useState } from "react";
import { getEventUsage, uploadMedia, type EventUsage } from "@/lib/mediaApi";
import { compressImageIfNeeded } from "@/lib/compressImage";
import { probeVideoDuration } from "@/lib/probeVideo";
import { formatBytes } from "@/constants/tierLimits";
import toast from "react-hot-toast";

const isVideoFile = (file: File) => file.type.startsWith("video/");

interface MediaUploadButtonProps {
    eventId: string;
    eventSlug?: string;
    onUploadSuccess: () => void;
}

const MediaUploadButton: React.FC<MediaUploadButtonProps> = ({
    eventId,
    eventSlug,
    onUploadSuccess,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploadCount, setUploadCount] = useState(0);
    const [usage, setUsage] = useState<EventUsage | null>(null);

    const refreshUsage = useCallback(async () => {
        try {
            const next = await getEventUsage(eventId);
            setUsage(next);
        } catch {
            // Non-fatal: UI just won't show capacity. Server still enforces.
        }
    }, [eventId]);

    useEffect(() => {
        refreshUsage();
    }, [refreshUsage]);

    const atCapacity = usage?.atCapacity ?? false;
    const fileSizeLimit = usage?.maxFileSizeBytes;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const resetInput = () => {
            if (inputRef.current) inputRef.current.value = "";
        };

        if (files.length > 10) {
            toast.error("You can upload up to 10 files at once.");
            resetInput();
            return;
        }

        if (usage && files.length > usage.remaining) {
            toast.error(
                usage.remaining === 0
                    ? `Storage limit reached for your ${usage.tier} tier. Upgrade for more capacity.`
                    : `Only ${usage.remaining} upload${usage.remaining === 1 ? "" : "s"} left on your ${usage.tier} tier.`,
            );
            resetInput();
            return;
        }

        const fileArray = Array.from(files);
        const videos = fileArray.filter(isVideoFile);
        const images = fileArray.filter((f) => !isVideoFile(f));

        // ---- Video-specific tier validation (size, duration, free-tier block).
        if (videos.length > 0) {
            if (!usage?.allowsVideo) {
                toast.error("Upgrade to Premium for video support.");
                resetInput();
                return;
            }

            const oversizeVideo = videos.find(
                (v) => v.size > usage.maxVideoBytes,
            );
            if (oversizeVideo) {
                toast.error(
                    `Video "${oversizeVideo.name}" exceeds the ${formatBytes(
                        usage.maxVideoBytes,
                    )} limit for your ${usage.tier} tier.`,
                );
                resetInput();
                return;
            }

            const durations = await Promise.all(
                videos.map((v) => probeVideoDuration(v)),
            );
            const tooLongIdx = durations.findIndex(
                (d) => d !== null && d > usage.maxVideoSeconds,
            );
            if (tooLongIdx >= 0) {
                toast.error(
                    `Video "${videos[tooLongIdx].name}" is longer than the ${usage.maxVideoSeconds}s limit for your ${usage.tier} tier.`,
                );
                resetInput();
                return;
            }
        }

        // ---- Image size check (tier image cap only; videos already validated).
        if (fileSizeLimit && images.length > 0) {
            const oversize = images.find((f) => f.size > fileSizeLimit);
            if (oversize) {
                toast.error(
                    `"${oversize.name}" is larger than the ${formatBytes(
                        fileSizeLimit,
                    )} per-file limit for your tier.`,
                );
                resetInput();
                return;
            }
        }

        setLoading(true);
        setUploadCount(fileArray.length);

        // Compress images only; videos pass through unchanged.
        const prepared = await Promise.all(
            fileArray.map((file) =>
                isVideoFile(file) ? file : compressImageIfNeeded(file),
            ),
        );

        const formData = new FormData();
        prepared.forEach((file) => {
            formData.append("files", file);
        });
        formData.append("eventId", eventId);

        try {
            await toast.promise(uploadMedia(formData, eventSlug), {
                loading: `Uploading ${fileArray.length} file${fileArray.length > 1 ? "s" : ""}...`,
                success:
                    videos.length > 0
                        ? `Upload received. ${videos.length} video${videos.length > 1 ? "s" : ""} processing in the background — it will appear in the gallery shortly.`
                        : `${fileArray.length} file${fileArray.length > 1 ? "s" : ""} uploaded!`,
                error: (err) =>
                    err instanceof Error ? err.message : "Upload failed",
            });
            onUploadSuccess();
        } catch {
            // toast.promise already surfaced the error; keep gallery state intact.
        } finally {
            setLoading(false);
            setUploadCount(0);
            resetInput();
            refreshUsage();
        }
    };

    const disabled = loading || atCapacity;
    const tooltip = atCapacity
        ? "Upload limit reached. Upgrade to Premium for more storage."
        : usage
          ? `${usage.used}/${usage.maxFiles} uploads used (${usage.tier})`
          : undefined;

    return (
        <>
            <button
                type="button"
                className="bg-cusblue text-cuscream px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                title={tooltip}>
                {loading
                    ? `Uploading ${uploadCount} file${uploadCount > 1 ? "s" : ""}...`
                    : atCapacity
                      ? "Limit reached"
                      : "Upload Media"}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={disabled}
            />
        </>
    );
};

export default MediaUploadButton;
