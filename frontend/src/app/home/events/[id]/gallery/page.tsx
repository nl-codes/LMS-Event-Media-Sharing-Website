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
import GalleryEventHeader from "@/components/gallery/GalleryEventHeader";
import HighlightsGrid from "@/components/media/HighlightsGrid";
import ChatContainer from "@/components/chat/ChatContainer";
import BackButton from "@/components/buttons/BackButton";
import GalleryToolbar from "@/components/gallery/GalleryToolbar";
import GalleryListSection from "@/components/gallery/GalleryListSection";
import type { Event } from "@/types/Event";
import EventNotFoundCard from "@/components/events/EventNotFoundCard";

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

    const {
        gallery,
        setGallery,
        handleDelete,
        handleLike,
        handleToggleHighlight,
    } = useGalleryState({
        eventId,
        currentUserId,
        canLike: Boolean(user),
        onMediaDeleted: handleRemoveFromSelection,
    });

    const eventEnded = event
        ? new Date(event.endTime).getTime() < Date.now()
        : false;
    const highlights = gallery.filter((m) => m.isHighlight);

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
        return <EventNotFoundCard />;
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
        <div className="max-w-5xl mx-auto px-4 flex flex-col py-4 gap-6">
            <div className="flex flex-row items-center gap-4">
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
                highlights={highlights}
                isHost={isHost}
                currentUserId={currentUserId}
                onLike={handleLike}
                disableLike={!user}
                onToggleHighlight={handleToggleHighlight}
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
                onToggleHighlight={handleToggleHighlight}
                eventEnded={eventEnded}
            />

            {event && (
                <ChatContainer
                    eventId={eventId}
                    eventName={event.eventName || "Event"}
                />
            )}
        </div>
    );
}
