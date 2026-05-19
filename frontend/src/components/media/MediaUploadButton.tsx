import React, { useCallback, useEffect, useRef, useState } from "react";
import { getEventUsage, uploadMedia, type EventUsage } from "@/lib/mediaApi";
import { formatBytes } from "@/constants/tierLimits";
import toast from "react-hot-toast";

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

        if (fileSizeLimit) {
            const oversize = Array.from(files).find(
                (f) => f.size > fileSizeLimit,
            );
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
        setUploadCount(files.length);

        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append("files", file);
        });
        formData.append("eventId", eventId);

        try {
            await toast.promise(uploadMedia(formData, eventSlug), {
                loading: `Uploading ${files.length} files...`,
                success: `${files.length} file${files.length > 1 ? "s" : ""} uploaded!`,
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
