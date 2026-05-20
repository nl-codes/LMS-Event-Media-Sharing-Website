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
        if (!eventId) return;
        try {
            const fetched = await getEventById(eventId);
            setEvent(fetched);
            const hostId =
                typeof fetched.hostId === "string"
                    ? fetched.hostId
                    : fetched.hostId?._id || "";
            setIsHost(hostId === currentUserId);
        } catch {
            setEvent(null);
            setIsHost(false);
        }
    }, [eventId, currentUserId]);

    useEffect(() => {
        if (!user) return;
        fetchGallery();
        fetchEventDetails();
    }, [user, fetchGallery, fetchEventDetails]);

    if (!user) {
        return (
            <div className="p-8 text-center">
                You must be logged in to view the gallery.
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
