"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/types/Event";
import JoinedEventSmallCard from "@/components/events/JoinedEventSmallCard";
import { getJoinedEvents } from "@/lib/membershipApi";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function RecentJoinedEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getJoinedEvents();
            setEvents(data.slice(0, 3));
        } catch {
            toast.error("Failed to load recent events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 p-8 bg-white/50 rounded-4xl border border-dashed border-slate-200">
                <Loader2 className="w-8 h-8 animate-spin text-cusblue/40" />
            </div>
        );
    }

    if (!events.length) return null;

    return (
        <div className="relative p-6 rounded-[2.5rem] bg-slate-50/50 border border-slate-100">
            <div className="flex items-center justify-between mb-6 px-2">
                <div>
                    <h2 className="text-lg font-black text-cusblue flex items-center gap-2 uppercase tracking-tight">
                        Recent Activity
                    </h2>
                </div>
                <Link
                    href="/home/events"
                    className="text-[11px] font-bold uppercase tracking-widest text-cusblue/50 hover:text-cusblue transition-colors">
                    View All
                </Link>
            </div>

            {/* VERTICAL STACK */}
            <div className="flex flex-col gap-3">
                {events.map((event) => (
                    <JoinedEventSmallCard key={event._id} event={event} />
                ))}
            </div>

            {/* Visual Flair: Decorative element */}
            <div className="mt-6 p-4 rounded-2xl bg-linear-to-br from-cusblue/5 to-cusviolet/5 border border-white flex items-center justify-center">
                <p className="text-[10px] font-bold text-cusblue/40 uppercase tracking-widest text-center">
                    Your recent {events.length} events
                </p>
            </div>
        </div>
    );
}
