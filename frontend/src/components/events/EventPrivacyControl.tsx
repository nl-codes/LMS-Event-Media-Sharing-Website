"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateEventPrivacy } from "@/lib/eventApi";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";
import EventPrivacyStatus from "./EventPrivacyStatus";

interface EventPrivacyControlProps {
    eventId: string;
    initialPrivacy: "public" | "private";
}

export default function EventPrivacyControl({
    eventId,
    initialPrivacy,
}: EventPrivacyControlProps) {
    const [privacy, setPrivacy] = useState<"public" | "private">(
        initialPrivacy,
    );
    const [submitting, setSubmitting] = useState(false);

    const isPublic = privacy === "public";

    const applyChange = async (next: "public" | "private") => {
        try {
            setSubmitting(true);
            const result = await updateEventPrivacy(eventId, next);
            setPrivacy(result.event.privacy);
            if (result.queueError) {
                toast.error(
                    "Privacy updated, but the media visibility sync could not be queued. Please toggle again to retry.",
                );
            } else {
                toast.success(
                    "Event privacy updated. Media visibility is syncing in the background.",
                );
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update privacy",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = () => {
        if (submitting) return;
        const next: "public" | "private" = isPublic ? "private" : "public";
        openConfirmationDialog({
            title:
                next === "public"
                    ? "Make event public?"
                    : "Make event private?",
            message:
                next === "public"
                    ? "All existing media in this event will become visible on the Explore feed. Future uploads will be public too."
                    : "All media in this event will be hidden from the Explore feed. Future uploads will be private.",
            confirmText: next === "public" ? "Make Public" : "Make Private",
            cancelText: "Cancel",
            isDanger: false,
            onConfirm: () => {
                void applyChange(next);
            },
        });
    };

    return (
        <section className="rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-md">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <EventPrivacyStatus isPublic={isPublic} />
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                            Event privacy
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-cusblue">
                            {isPublic ? "Public" : "Private"}
                        </p>
                        <p className="mt-1 text-xs text-cusviolet/70">
                            {isPublic
                                ? "Media from this event appears on the Explore feed."
                                : "Media stays inside the event and is not shown on Explore."}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={submitting}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cusblue/20 bg-white px-4 py-2 text-sm font-bold text-cusblue transition hover:bg-cuscream disabled:opacity-60 w-full sm:w-auto">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Make {isPublic ? "Private" : "Public"}
                </button>
            </div>
        </section>
    );
}
