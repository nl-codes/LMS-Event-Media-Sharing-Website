"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import { useIdentity } from "@/context/IdentityContext";
import { getEventBySlug } from "@/lib/eventApi";
import { getScopedGuestUserName } from "@/lib/guestIdentity";
import { useSelection } from "@/hooks/useSelection";
import { useGalleryState } from "@/hooks/useGalleryState";
import {
    bulkDeleteWithConfirm,
    downloadGalleryMedia,
    loadGallery,
} from "@/lib/galleryHelpers";
import GalleryEventHeader from "@/components/events/GalleryEventHeader";
import HighlightsGrid from "@/components/media/HighlightsGrid";
import ChatContainer from "@/components/chat/ChatContainer";
import BackButton from "@/components/navigation/BackButton";
import UserAvatar from "@/components/common/UserAvatar";
import GalleryToolbar from "@/components/gallery/GalleryToolbar";
import GalleryListSection from "@/components/gallery/GalleryListSection";
import type { Event } from "@/types/Event";
import EventNotFoundCard from "@/components/events/EventNotFoundCard";

export default function EventPublicGallery() {
    const params = useParams();
    const slug = typeof params?.slug === "string" ? params.slug : "";
    const { user } = useUser();
    const { displayName } = useIdentity();
    const currentUserId = user?._id || "";

    const [eventId, setEventId] = useState("");
    const [event, setEvent] = useState<Event | null>(null);
    const [loadingEvent, setLoadingEvent] = useState(true);
    const [loadingGallery, setLoadingGallery] = useState(false);

    const {
        isActive: isSelectionActive,
        selectedIds,
        start: handleStartSelection,
        clear: handleClearSelection,
        toggle: handleSelectToggle,
        remove: handleRemoveFromSelection,
    } = useSelection();

    const isHost =
        event?.hostId &&
        typeof event.hostId === "object" &&
        "_id" in event.hostId
            ? event.hostId._id === currentUserId
            : event?.hostId === currentUserId;

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

    const scopedGuestDisplayName = slug ? getScopedGuestUserName(slug) : null;
    const uploaderDisplayName =
        user?.userName || scopedGuestDisplayName || displayName;

    const fetchGallery = useCallback(
        async (resolvedEventId: string) => {
            setLoadingGallery(true);
            try {
                const data = await loadGallery(resolvedEventId);
                setGallery(data);
            } catch (err) {
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Failed to load gallery",
                );
            } finally {
                setLoadingGallery(false);
            }
        },
        [setGallery],
    );

    useEffect(() => {
        let isMounted = true;

        async function resolveEventAndLoadGallery() {
            if (!slug) {
                if (isMounted) setLoadingEvent(false);
                return;
            }

            setLoadingEvent(true);
            try {
                const resolved = await getEventBySlug(slug);
                if (!resolved?._id) throw new Error("Event not found");
                if (!isMounted) return;
                setEventId(resolved._id);
                setEvent(resolved);
                await fetchGallery(resolved._id);
            } catch (err) {
                if (isMounted) {
                    setEventId("");
                    setEvent(null);
                    setGallery([]);
                    handleClearSelection();
                    toast.error(
                        err instanceof Error
                            ? err.message
                            : "Failed to load event",
                    );
                }
            } finally {
                if (isMounted) setLoadingEvent(false);
            }
        }

        resolveEventAndLoadGallery();
        return () => {
            isMounted = false;
        };
    }, [slug, fetchGallery, handleClearSelection, setGallery]);

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

    const handleBulkDelete = () => {
        bulkDeleteWithConfirm({
            selectedIds,
            gallery,
            enforceUploaderId: isHost ? null : currentUserId,
            onSuccess: (deletedIds) => {
                setGallery((prev) =>
                    prev.filter((m) => !deletedIds.includes(m._id)),
                );
                handleClearSelection();
            },
        });
    };

    if (loadingEvent) {
        return <div className="py-10 text-center">Loading event...</div>;
    }

    if (!eventId) {
        return <EventNotFoundCard />;
    }

    return (
        <div className="max-w-5xl mx-auto px-4 flex flex-col py-4 gap-6">
            <div className="flex flex-row items-center gap-4">
                <BackButton
                    href={`/events/${slug}`}
                    label="Back to Event"
                    replace={true}
                />
            </div>

            {event && (
                <GalleryEventHeader
                    event={event}
                    subtitle="Shared Event Gallery"
                />
            )}

            <GalleryToolbar
                eventId={eventId}
                eventSlug={slug}
                eventEndTime={event?.endTime}
                identityStrip={
                    <>
                        <UserAvatar
                            src={user?.profilePicture}
                            name={uploaderDisplayName}
                            size="small"
                        />
                        <span>Uploading as {uploaderDisplayName}</span>
                    </>
                }
                isSelectionActive={isSelectionActive}
                selectedCount={selectedIds.length}
                galleryCount={gallery.length}
                canShowSelectionBar={isHost || Boolean(user)}
                onToggleSelection={
                    isSelectionActive
                        ? handleClearSelection
                        : handleStartSelection
                }
                onUploadSuccess={(hasVideos) => {
                    if (hasVideos) void fetchGallery(eventId);
                }}
                onDownload={handleDownload}
                onBulkDelete={handleBulkDelete}
                disableDownloadWhenEmpty
            />

            <HighlightsGrid
                highlights={highlights}
                isHost={Boolean(user) ? isHost : false}
                currentUserId={Boolean(user) ? currentUserId : ""}
                onToggleHighlight={isHost ? handleToggleHighlight : undefined}
            />

            <GalleryListSection
                mediaItems={gallery}
                isLoading={loadingGallery}
                isHost={isHost}
                currentUserId={Boolean(user) ? currentUserId : ""}
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
