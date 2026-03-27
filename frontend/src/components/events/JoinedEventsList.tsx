"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/types/Event";
import EventCard from "@/components/events/EventCard";
import { getJoinedEvents } from "@/lib/membershipApi";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function JoinedEventsList() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const data = await getJoinedEvents();
            setEvents(data);
            setError("");
        } catch (e) {
            setError((e as Error).message);
            toast.error("Failed to load joined events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-cusblue">
                <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-50" />
                <p className="font-medium animate-pulse">
                    Loading joined events...
                </p>
            </div>
        );
    }

    if (error && !events.length) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center">
                {error}
            </div>
        );
    }

    if (!events.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-white/30 rounded-3xl border-2 border-dashed border-cusblue/10">
                <div className="bg-cuscream p-4 rounded-full mb-4">
                    <CalendarDays className="w-12 h-12 text-cusblue opacity-40" />
                </div>
                <h3 className="text-xl font-bold text-cusblue">
                    No joined events
                </h3>
                <p className="text-cusviolet max-w-xs mt-2">
                    Events you join will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((event) => (
                <EventCard key={event._id} event={event} isHost={false} />
            ))}
        </div>
    );
}
