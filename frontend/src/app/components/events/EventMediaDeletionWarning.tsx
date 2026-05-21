"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, Clock } from "lucide-react";
import type { MediaDeletionStatus } from "@/types/Event";
import { HelperFormatDateTime } from "@/utils/HelperFunctions";

export type EventMediaDeletionWarningProps = {
    deleteAt?: string | null;
    warningStartsAt?: string | null;
    mediaDeletedAt?: string | null;
    mediaDeletionStatus?: MediaDeletionStatus;
    /** Compact variant for the public gallery: only show the deleted-state pill. */
    deletedOnly?: boolean;
};

const formatCountdown = (msRemaining: number) => {
    const clamped = Math.max(0, Math.floor(msRemaining / 1000));
    const days = Math.floor(clamped / 86400);
    const hours = Math.floor((clamped % 86400) / 3600);
    const minutes = Math.floor((clamped % 3600) / 60);
    const seconds = clamped % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

export default function EventMediaDeletionWarning({
    deleteAt,
    warningStartsAt,
    mediaDeletedAt,
    mediaDeletionStatus,
    deletedOnly = false,
}: EventMediaDeletionWarningProps) {
    // Cheap once-a-second tick — only mounted when we're actually rendering
    // the countdown branch (see early returns below).
    const [now, setNow] = useState(() => Date.now());

    const deleteAtTime = useMemo(
        () => (deleteAt ? new Date(deleteAt).getTime() : Number.NaN),
        [deleteAt],
    );
    const warningStartsAtTime = useMemo(
        () =>
            warningStartsAt ? new Date(warningStartsAt).getTime() : Number.NaN,
        [warningStartsAt],
    );

    const inCountdownWindow =
        Number.isFinite(deleteAtTime) &&
        Number.isFinite(warningStartsAtTime) &&
        now >= warningStartsAtTime &&
        now < deleteAtTime &&
        mediaDeletionStatus !== "completed";

    useEffect(() => {
        if (!inCountdownWindow) return;
        const interval = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(interval);
    }, [inCountdownWindow]);

    // 1. Already deleted — terminal message for both host + public galleries.
    if (mediaDeletionStatus === "completed") {
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 backdrop-blur-md px-5 py-4 shadow-sm">
                <Archive className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-slate-700">
                        Media retention period is over
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Media for this event has been permanently deleted
                        {mediaDeletedAt
                            ? ` on ${HelperFormatDateTime(mediaDeletedAt)}.`
                            : "."}
                    </p>
                </div>
            </div>
        );
    }

    // The public-gallery variant only renders the completed pill — no
    // countdown, no pending message.
    if (deletedOnly) {
        return null;
    }

    // 2. Past deadline but the worker hasn't cleaned up yet (we already
    // returned above if status is "completed", so reaching here means it
    // isn't).
    if (Number.isFinite(deleteAtTime) && now >= deleteAtTime) {
        return (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 backdrop-blur-md px-5 py-4 shadow-sm">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-amber-800">
                        Media retention period has ended
                    </p>
                    <p className="mt-1 text-xs text-amber-700/90">
                        Cleanup is pending/ Therefore, media will be removed
                        shortly.
                    </p>
                </div>
            </div>
        );
    }

    // 3. Inside the warning window: show the deletion date + a live countdown.
    if (inCountdownWindow) {
        return (
            <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 backdrop-blur-md px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-amber-800">
                            Media for this event will be permanently deleted on{" "}
                            {HelperFormatDateTime(deleteAt as string)}
                        </p>
                        <p className="mt-1 text-xs text-amber-700/90">
                            Download anything you want to keep before the
                            countdown ends.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-white/70 px-3 py-2 text-xs font-bold text-amber-800 shadow-inner">
                    <Clock className="w-3.5 h-3.5" />
                    {formatCountdown(deleteAtTime - now)}
                </div>
            </div>
        );
    }

    // 4. Before warning window starts — render nothing.
    return null;
}
