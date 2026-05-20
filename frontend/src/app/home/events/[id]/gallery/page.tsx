"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { getEventById } from "@/lib/eventApi";
import { useSelection } from "@/hooks/useSelection";
import { useGalleryState } from "@/hooks/useGalleryState";
import {
    bulkDeleteWithConfirm,
    downloadGalleryMedia,
    loadGallery,
} from "@/lib/galleryHelpers";
import GalleryEventHeader from "@/components/events/GalleryEventHeader";
import HighlightsGrid from "@/components/media/HighlightsGrid";
import BackButton from "@/components/navigation/BackButton";
import GalleryToolbar from "@/components/gallery/GalleryToolbar";
import GalleryListSection from "@/components/gallery/GalleryListSection";
import type { Event } from "@/types/Event";

export default function HostGalleryPage() {
    const params = useParams();
    const eventId = typeof params?.id === "string" ? params.id : "";
    const { user } = useUser();
    const currentUserId = user?._id || "";

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [eventNotFound, setEventNotFound] = useState(false);
    const [isHost, setIsHost] = useState(false);

    const {
        isActive: isSelectionActive,
        selectedIds,
        start: handleStartSelection,
        clear: handleClearSelection,
        toggle: handleSelectToggle,
        remove: handleRemoveFromSelection,
    } = useSelection({ canStart: () => isHost });

    const { gallery, setGallery, handleDelete, handleLike } = useGalleryState({
        eventId,
        currentUserId,
        canLike: Boolean(user),
        onMediaDeleted: handleRemoveFromSelection,
    });

    const fetchGallery = useCallback(async () => {
        try {
            const data = await loadGallery(eventId);
            setGallery(data);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to load gallery",
            );
        } finally {
            setLoading(false);
        }
    }, [eventId, setGallery]);

    const fetchEventDetails = useCallback(async () => {
        if (!eventId) return null;
        try {
            const fetched = await getEventById(eventId);
            setEvent(fetched);
            setEventNotFound(false);
            const hostId =
                typeof fetched.hostId === "string"
                    ? fetched.hostId
                    : fetched.hostId?._id || "";
            setIsHost(hostId === currentUserId);
            return fetched;
        } catch {
            setEvent(null);
            setEventNotFound(true);
            setIsHost(false);
            setGallery([]);
            return null;
        }
    }, [eventId, currentUserId, setGallery]);

    useEffect(() => {
        if (!user) return;
        let isMounted = true;

        const loadPage = async () => {
            setLoading(true);
            const fetched = await fetchEventDetails();
            if (!isMounted) return;

            if (!fetched) {
                setLoading(false);
                return;
            }

            await fetchGallery();
        };

        void loadPage();

        return () => {
            isMounted = false;
        };
    }, [user, fetchGallery, fetchEventDetails]);

    if (!user) {
        return (
            <div className="p-8 text-center">
                You must be logged in to view the gallery.
            </div>
        );
    }

    if (eventNotFound) {
        return (
            <div className="mx-auto max-w-5xl p-4">
                <div className="mb-4 flex flex-row items-center gap-4">
                    <BackButton label="Back to Events" />
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/60 p-8 text-center shadow-xl backdrop-blur-md">
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cusviolet">
                        Event not found
                    </p>
                    <h1 className="mt-3 text-3xl font-black text-cusblue">
                        This event could not be found.
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
                        The event may have been removed, or the link may be
                        incorrect.
                    </p>
                </div>
            </div>
        );
    }

    const handleDownload = () => {
        const media = isSelectionActive
            ? gallery.filter((m) => selectedIds.includes(m._id))
            : gallery;
        downloadGalleryMedia({
            media,
            eventName: event?.eventName || "event-gallery",
            isSelection: isSelectionActive,
        });
    };

    const handleConfirmBulkDelete = () => {
        bulkDeleteWithConfirm({
            selectedIds,
            gallery,
            onSuccess: (deletedIds) => {
                setGallery((prev) =>
                    prev.filter((m) => !deletedIds.includes(m._id)),
                );
                handleClearSelection();
            },
        });
    };

    const hostObject =
        event && typeof event.hostId === "object" && event.hostId
            ? event.hostId
            : null;
    const hostDisplayName =
        (hostObject &&
            (("username" in hostObject && hostObject.username) ||
                ("userName" in (hostObject as { userName?: string }) &&
                    (hostObject as { userName?: string }).userName) ||
                ("email" in hostObject && hostObject.email))) ||
        "Host";
    const gallerySubtitle = isHost
        ? "Your Event Gallery"
        : `${hostDisplayName}'s Gallery`;

    return (
        <div className="max-w-5xl mx-auto p-4">
            <div className="mb-4 flex flex-row items-center gap-4">
                <BackButton label="Back to Event" />
            </div>

            {event && (
                <GalleryEventHeader event={event} subtitle={gallerySubtitle} />
            )}

            <GalleryToolbar
                eventId={eventId}
                eventEndTime={event?.endTime}
                isSelectionActive={isSelectionActive}
                selectedCount={selectedIds.length}
                galleryCount={gallery.length}
                canShowSelectionBar={isHost}
                onToggleSelection={
                    isSelectionActive
                        ? handleClearSelection
                        : handleStartSelection
                }
                onUploadSuccess={(hasVideos) => {
                    if (hasVideos) void fetchGallery();
                }}
                onDownload={handleDownload}
                onBulkDelete={handleConfirmBulkDelete}
            />

            <HighlightsGrid
                eventId={eventId}
                isHost={isHost}
                currentUserId={currentUserId}
            />

            <GalleryListSection
                mediaItems={gallery}
                isLoading={loading}
                isHost={isHost}
                currentUserId={currentUserId}
                userExists={Boolean(user)}
                isSelectionActive={isSelectionActive}
                selectedIds={selectedIds}
                onSelectionToggle={handleSelectToggle}
                onLike={handleLike}
                onDelete={handleDelete}
            />
        </div>
    );
}
