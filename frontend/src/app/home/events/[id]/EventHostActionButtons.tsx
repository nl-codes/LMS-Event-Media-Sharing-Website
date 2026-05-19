"use client";

import Button from "@/components/buttons/Button";
import BackButton from "@/components/navigation/BackButton";
import { Edit3, Images, QrCode, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Event } from "@/types/Event";

interface EventHostActionButtonsProps {
    event: Event;
    setShowQR: (show: boolean) => void;
}

export default function EventHostActionButtons({
    event,
    setShowQR,
}: EventHostActionButtonsProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between">
            <BackButton label="Back to My Events" />
            <div className="flex flex-wrap items-center gap-3">
                {!event.isPremium && (
                    <Button
                        onClick={() =>
                            router.push(`/home/events/${event._id}/upgrade`)
                        }
                        className="flex items-center gap-2 bg-linear-to-r from-cusblue to-cusviolet text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition-all font-bold text-sm">
                        <Zap className="w-4 h-4 fill-current" /> Upgrade
                    </Button>
                )}
                <Button
                    onClick={() => setShowQR(true)}
                    className="flex items-center gap-2 bg-white border border-slate-200 text-cusblue px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
                    <QrCode className="w-4 h-4" /> QR Code
                </Button>
                <Button
                    onClick={() =>
                        router.push(`/home/events/${event._id}/gallery`)
                    }
                    className="flex items-center gap-2 bg-white border border-slate-200 text-cusblue px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-bold text-sm shadow-sm">
                    <Images className="w-4 h-4" /> Gallery
                </Button>
                <Button
                    onClick={() =>
                        router.push(`/home/events/${event._id}/edit`)
                    }
                    className="flex items-center gap-2 bg-cusblue text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-all font-bold text-sm shadow-md">
                    <Edit3 className="w-4 h-4" /> Edit
                </Button>
            </div>
        </div>
    );
}
