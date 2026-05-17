"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AlertCircle } from "lucide-react";
import { getFlaggedMedia } from "@/lib/reportApi";
import { type FlaggedMedia } from "@/types/Media";

export default function FlaggedMediaSection() {
    const [items, setItems] = useState<FlaggedMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getFlaggedMedia();
                if (!cancelled) setItems(data);
            } catch {
                if (!cancelled) setItems([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return null;
    if (items.length === 0) return null;

    return (
        <section className="mt-6 w-full max-w-lg mx-auto rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 bg-red-50 border-b border-red-200 px-6 py-4">
                <AlertCircle className="h-5 w-5 text-rose-600" />
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600">
                        Moderation
                    </p>
                    <h3 className="text-sm font-black text-rose-600">
                        Flagged Media ({items.length})
                    </h3>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
                {items.map((m) => (
                    <div
                        key={m._id}
                        className="overflow-hidden rounded-2xl border border-red-200 bg-red-50">
                        <div className="relative h-32 w-full bg-slate-100">
                            {m.mediaType === "video" ? (
                                <video
                                    src={m.mediaUrl}
                                    className="h-full w-full object-cover opacity-60"
                                    muted
                                />
                            ) : (
                                <Image
                                    src={m.mediaUrl}
                                    alt={m.label || "Flagged media"}
                                    fill
                                    className="object-cover opacity-60"
                                    sizes="200px"
                                />
                            )}
                        </div>
                        <div className="p-2">
                            <p className="truncate text-[11px] font-bold text-rose-600">
                                Hidden
                            </p>
                            {m.hiddenReason && (
                                <p className="mt-1 text-[10px] text-slate-600 line-clamp-2">
                                    {m.hiddenReason}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
