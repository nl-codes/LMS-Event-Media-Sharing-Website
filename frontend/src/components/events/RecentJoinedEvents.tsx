"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/types/Event";
import EventCard from "@/components/events/EventCard";
import { getJoinedEvents } from "@/lib/membershipApi";
import { CalendarDays, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function RecentJoinedEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const data = await getJoinedEvents();
            setEvents(data.slice(0, 3));
            setError("");
        } catch (e) {
            setError((e as Error).message);
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
            <div className="flex items-center justify-center py-8 text-cusblue">
                <Loader2 className="w-6 h-6 animate-spin mr-2 opacity-50" />
                <p className="text-sm font-medium animate-pulse">Loading...</p>
            </div>
        );
    }

    if (error || !events.length) {
        return null;
    }

    return (
        <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-cusblue flex items-center gap-2">
                        <CalendarDays className="w-6 h-6" /> Recent Joined
                        Events
                    </h2>
                    <p className="text-cusviolet/70 text-sm mt-1">
                        Your most recently joined experiences
                    </p>
                </div>
                <Link
                    href="/home/events"
                    className="flex items-center gap-2 text-cusblue font-semibold hover:text-cusviolet transition-colors group">
                    View all
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <EventCard key={event._id} event={event} isHost={false} />
                ))}
            </div>
        </div>
    );
}
