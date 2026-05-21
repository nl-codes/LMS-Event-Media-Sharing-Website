"use client";

import { ImageIcon, Loader2, Lock, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Event } from "@/types/Event";
import { isEventFinished } from "@/lib/eventDuration";

interface GalleryAccessHandlerProps {
    event: Event;
    checking: boolean;
    gateResult: { msg: string; success: boolean } | null;
    onCheckUpload: () => Promise<void>;
}

export default function GalleryAccessHandler({
    event,
    checking,
    gateResult,
    onCheckUpload,
}: GalleryAccessHandlerProps) {
    const router = useRouter();

    const isFinished = isEventFinished(event);

    return (
        <div className="pt-4">
            {isFinished || gateResult?.success ? (
                <button
                    onClick={() =>
                        router.push(`/events/${event.uniqueSlug}/gallery`)
                    }
                    className="w-full md:w-auto px-8 py-4 bg-cusblue text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-cusblue/20">
                    <ImageIcon className="w-5 h-5" />
                    View Event Gallery
                </button>
            ) : !gateResult ? (
                <button
                    onClick={onCheckUpload}
                    disabled={checking}
                    className="w-full md:w-auto px-8 py-4 bg-cusblue text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-cusblue/20">
                    {checking ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <ShieldCheck className="w-5 h-5" />
                            Verify Access to Upload
                        </>
                    )}
                </button>
            ) : (
                <div className="p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-red-50 border border-red-200">
                    <div className="flex items-start gap-3">
                        <Lock className="w-5 h-5 text-red-600 shrink-0" />
                        <p className="text-sm font-bold leading-tight text-red-800">
                            {gateResult.msg}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
