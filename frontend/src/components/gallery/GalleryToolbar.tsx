"use client";

import type { ReactNode } from "react";
import MediaUploadButton from "@/components/media/MediaUploadButton";
import SelectionActionBar from "@/components/events/SelectionActionBar";
import type { EventStatus } from "@/types/Event";

interface GalleryToolbarProps {
    eventId: string;
    eventSlug?: string;
    eventEndTime?: string;
    eventStatus?: EventStatus;
    /** Optional left-side slot (e.g. "Uploading as X" pill on the public page). */
    identityStrip?: ReactNode;
    isSelectionActive: boolean;
    selectedCount: number;
    galleryCount: number;
    canShowSelectionBar: boolean;
    onToggleSelection: () => void;
    onUploadSuccess: (hasVideos: boolean) => void;
    onDownload: () => void;
    onBulkDelete: () => void;
    /** Disables Download All until the gallery has something to zip. */
    disableDownloadWhenEmpty?: boolean;
}

export default function GalleryToolbar({
    eventId,
    eventSlug,
    eventEndTime,
    eventStatus,
    identityStrip,
    isSelectionActive,
    selectedCount,
    galleryCount,
    canShowSelectionBar,
    onToggleSelection,
    onUploadSuccess,
    onDownload,
    onBulkDelete,
    disableDownloadWhenEmpty = false,
}: GalleryToolbarProps) {
    return (
        <div className="w-full lg:w-auto">
            <div className="rounded-4xl border border-white/40 bg-white/60 p-4 shadow-xl shadow-cusblue/5 backdrop-blur-md flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {identityStrip ? (
                        <div className="flex items-center gap-2 text-xs text-cusviolet/70">
                            {identityStrip}
                        </div>
                    ) : (
                        <span />
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onToggleSelection}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50">
                            {isSelectionActive
                                ? "Unselect Media"
                                : "Select Media"}
                        </button>

                        <MediaUploadButton
                            eventId={eventId}
                            eventSlug={eventSlug}
                            eventEndTime={eventEndTime}
                            eventStatus={eventStatus}
                            onUploadSuccess={onUploadSuccess}
                        />

                        <button
                            type="button"
                            onClick={onDownload}
                            disabled={
                                disableDownloadWhenEmpty && galleryCount === 0
                            }
                            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
                            Download All
                        </button>
                    </div>
                </div>

                {isSelectionActive && (
                    <SelectionActionBar
                        selectedCount={selectedCount}
                        totalCount={galleryCount}
                        onDownload={onDownload}
                        onDelete={onBulkDelete}
                        isUser={canShowSelectionBar}
                    />
                )}
            </div>
        </div>
    );
}
