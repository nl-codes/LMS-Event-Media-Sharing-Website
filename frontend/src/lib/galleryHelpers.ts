import toast from "react-hot-toast";
import { deleteMultipleMedia, getGallery } from "@/lib/mediaApi";
import {
    downloadAsZip,
    normalizeMediaLikes,
} from "@/utils/HelperFunctions";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";
import type { Media } from "@/types/Media";

const MAX_BULK_DELETE_ITEMS = 20;

// Fetches the gallery for an event and normalizes likes. Caller owns the
// loading flag and the resulting setState.
export async function loadGallery(eventId: string): Promise<Media[]> {
    const data = await getGallery(eventId);
    return data.map(normalizeMediaLikes);
}

type DownloadOpts = {
    media: Media[];
    eventName: string;
    isSelection: boolean;
};

// Builds a zip of the given media and triggers the download. No-op when empty.
export function downloadGalleryMedia({
    media,
    eventName,
    isSelection,
}: DownloadOpts): void {
    if (!media.length) return;
    const zipName = isSelection
        ? `${eventName || "event-gallery"}-selected-media`
        : `${eventName || "event-gallery"}-all-media`;
    void downloadAsZip(media, zipName);
}

type BulkDeleteOpts = {
    selectedIds: string[];
    gallery: Media[];
    /**
     * When provided, every selected media item must belong to this user — used
     * by the public gallery to stop guests/users from deleting media they
     * don't own. Hosts pass `null` (or omit) to skip the check.
     */
    enforceUploaderId?: string | null;
    onSuccess: (deletedIds: string[]) => void;
};

// Validates the selection, shows the confirmation dialog, runs the bulk delete
// with a toast.promise, and calls onSuccess with the ids that were deleted so
// the caller can prune local state + clear selection.
export function bulkDeleteWithConfirm({
    selectedIds,
    gallery,
    enforceUploaderId = null,
    onSuccess,
}: BulkDeleteOpts): void {
    if (!selectedIds.length) return;

    if (enforceUploaderId) {
        const selectedMedia = gallery.filter((m) =>
            selectedIds.includes(m._id),
        );
        const hasUnauthorizedMedia = selectedMedia.some(
            (m) => m.uploaderId?._id !== enforceUploaderId,
        );
        if (hasUnauthorizedMedia) {
            toast.error("You can only delete media you have uploaded.");
            return;
        }
    }

    const selectedCount = selectedIds.length;
    if (selectedCount > MAX_BULK_DELETE_ITEMS) {
        toast.error(
            `You can only delete ${MAX_BULK_DELETE_ITEMS} items at a time`,
        );
        return;
    }

    const idsToDelete = [...selectedIds];

    openConfirmationDialog({
        title: "Delete selected media?",
        message: `This will permanently delete ${selectedCount} media item${selectedCount > 1 ? "s" : ""}. This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        isDanger: true,
        onConfirm: async () => {
            await toast.promise(deleteMultipleMedia(idsToDelete), {
                loading: "Deleting selected media...",
                success: `Deleted ${selectedCount} item${selectedCount > 1 ? "s" : ""}`,
                error: (err) =>
                    err instanceof Error ? err.message : "Bulk delete failed",
            });
            onSuccess(idsToDelete);
        },
    });
}
