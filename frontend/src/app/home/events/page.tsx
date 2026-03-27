"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Event } from "@/types/Event";
import MyEventCard from "@/components/events/MyEventCard";
import JoinedEventsList from "@/components/events/JoinedEventsList";
import BackButton from "@/components/navigation/BackButton";
import { deleteEvent, getHostEvents } from "@/lib/eventApi";
import { Plus, CalendarDays, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        try {
            setLoading(true);
            const data = await getHostEvents();
            setEvents(data);
            setError("");
        } catch (e) {
            setError((e as Error).message);
            toast.error("Failed to load events");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const onDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        const loadingToast = toast.loading("Deleting event...");
        try {
            await deleteEvent(id);
            setEvents((prev) => prev.filter((e) => e._id !== id));
            toast.success("Event deleted", { id: loadingToast });
        } catch (e) {
            toast.error((e as Error).message, { id: loadingToast });
        }
    };

    return (
        <main className="max-w-7xl mx-auto px-6 py-10 min-h-screen">
            <div className="mb-6 flex flex-row items-center gap-4">
                <BackButton label="Back to dashboard" />
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div>
                    <h1 className="text-4xl font-bold text-cusblue tracking-tight">
                        My Events
                    </h1>
                    <p className="text-cusviolet mt-1 opacity-80">
                        Manage and monitor your hosted experiences
                    </p>
                </div>

                <Link
                    href="/home/events/create"
                    className="flex items-center justify-center gap-2 bg-cusblue text-cuscream px-6 py-3 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 w-full md:w-auto">
                    <Plus className="w-5 h-5" />
                    Create Event
                </Link>
            </div>

            <hr className="border-cusblue/10 mb-10" />

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 text-cusblue">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-50" />
                    <p className="font-medium animate-pulse">
                        Fetching your events...
                    </p>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center">
                    {error}
                </div>
            )}

            {/* Empty State */}
            {!loading && !events.length && !error && (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-white/30 rounded-3xl border-2 border-dashed border-cusblue/10 profile-card-animate">
                    <div className="bg-cuscream p-4 rounded-full mb-4">
                        <CalendarDays className="w-12 h-12 text-cusblue opacity-40" />
                    </div>
                    <h3 className="text-xl font-bold text-cusblue">
                        No events found
                    </h3>
                    <p className="text-cusviolet max-w-xs mt-2 mb-6">
                        You haven&apos;t created any events yet. Ready to start
                        your first one?
                    </p>
                    <Link
                        href="/home/events/create"
                        className="text-cusblue font-bold underline underline-offset-4 hover:text-cusviolet transition-colors">
                        Create your first event now
                    </Link>
                </div>
            )}

            {/* Events Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {events.map((event) => (
                    <MyEventCard
                        key={event._id}
                        event={event}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {/* Joined Events Section */}
            <div className="mt-16">
                <h2 className="text-3xl font-bold text-cusblue tracking-tight mb-2">
                    Events I&apos;ve Joined
                </h2>
                <p className="text-cusviolet opacity-80 mb-8">
                    Events you&apos;re participating in
                </p>
                <JoinedEventsList />
            </div>
        </main>
    );
}
