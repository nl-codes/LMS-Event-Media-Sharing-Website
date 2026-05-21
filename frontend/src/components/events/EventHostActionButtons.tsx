"use client";

import { useState } from "react";
import Button from "@/components/buttons/Button";
import BackButton from "@/components/buttons/BackButton";
import {
    CheckCircle2,
    Edit3,
    Images,
    QrCode,
    TrendingUp,
    Users,
    Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Event } from "@/types/Event";
import { finishEvent } from "@/lib/eventApi";

interface EventHostActionButtonsProps {
    event: Event;
    setShowQR: (show: boolean) => void;
    onEventUpdated?: (event: Event) => void;
}

export default function EventHostActionButtons({
    event,
    setShowQR,
    onEventUpdated,
}: EventHostActionButtonsProps) {
    const router = useRouter();
    const [finishing, setFinishing] = useState(false);

    const canFinish = event.status === "Active";

    const handleFinish = async () => {
        if (!canFinish || finishing) return;
        const confirmed = window.confirm(
            "Finish this event now? Uploads will close immediately and highlights can be generated. This cannot be undone.",
        );
        if (!confirmed) return;

        setFinishing(true);
        try {
            const updated = await finishEvent(event._id);
            toast.success("Event marked as completed");
            onEventUpdated?.(updated);
            router.refresh();
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to finish event",
            );
        } finally {
            setFinishing(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between">
            <BackButton href="/home/events" replace label="Back to My Events" />
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    onClick={() =>
                        router.push(`/home/events/${event._id}/participants`)
                    }>
                    <Users className="w-4 h-4" /> Participants
                </Button>
                <Button
                    onClick={() =>
                        router.push(`/home/events/${event._id}/insights`)
                    }>
                    <TrendingUp className="w-4 h-4" /> Insights
                </Button>
                {!event.isPremium && (
                    <Button
                        onClick={() =>
                            router.push(`/home/events/${event._id}/upgrade`)
                        }>
                        <Zap className="w-4 h-4 fill-current" /> Upgrade
                    </Button>
                )}
                <Button onClick={() => setShowQR(true)}>
                    <QrCode className="w-4 h-4" /> QR Code
                </Button>
                <Button
                    onClick={() =>
                        router.push(`/home/events/${event._id}/gallery`)
                    }>
                    <Images className="w-4 h-4" /> Gallery
                </Button>
                <Button
                    onClick={() =>
                        router.push(`/home/events/${event._id}/edit`)
                    }>
                    <Edit3 className="w-4 h-4" /> Edit
                </Button>
                {canFinish && (
                    <Button onClick={handleFinish} loading={finishing}>
                        <CheckCircle2 className="w-4 h-4" /> Finish Event
                    </Button>
                )}
            </div>
        </div>
    );
}
