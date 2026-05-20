"use client";

import { useEffect, useRef, useState } from "react";
import { Compass, Images, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "@/components/navigation/BackButton";
import SearchExploreEventCard from "@/components/events/SearchExploreEventCard";
import { listPublicEvents } from "@/lib/eventApi";
import type { Event } from "@/types/Event";
import Button from "@/components/buttons/Button";
import { useRouter } from "next/navigation";

const SEARCH_DEBOUNCE_MS = 300;

export default function ExploreEventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    // Track the latest request so older searches can't overwrite newer ones.
    const requestIdRef = useRef(0);
    const router = useRouter();

    useEffect(() => {
        const t = setTimeout(
            () => setDebouncedQuery(query),
            SEARCH_DEBOUNCE_MS,
        );
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        const myId = ++requestIdRef.current;
        setIsLoading(true);
        (async () => {
            try {
                const data = await listPublicEvents({
                    q: debouncedQuery,
                    limit: 100,
                });
                if (myId !== requestIdRef.current) return;
                setEvents(data);
            } catch (err) {
                if (myId !== requestIdRef.current) return;
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Failed to load events",
                );
                setEvents([]);
            } finally {
                if (myId === requestIdRef.current) setIsLoading(false);
            }
        })();
    }, [debouncedQuery]);

    return (
        <main className="min-h-screen bg-cuscream px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex flex-row items-center gap-4">
                    <BackButton label="Back" />
                </div>

                <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cusblue to-cusviolet text-cuscream shadow-lg shadow-cusblue/20">
                            <Compass className="h-6 w-6" />
                        </span>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                                Discover
                            </p>
                            <h1 className="text-3xl font-extrabold tracking-tight text-cusblue sm:text-4xl">
                                Public events
                            </h1>
                        </div>
                    </div>

                    <Button
                        onClick={() => router.push("/explore/media")}
                        className="inline-flex items-center gap-2 rounded-xl border border-cusblue/15 bg-white px-4 py-2 text-sm font-bold text-cusblue transition hover:bg-cuscream">
                        <Images className="h-4 w-4" />
                        Browse media
                    </Button>
                </header>

                <div className="relative mb-6">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cusblue/35" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by event name or location..."
                        className="h-13 w-full rounded-2xl border border-cusblue/10 bg-white/70 py-3 pl-12 pr-4 text-sm font-medium text-cusblue outline-none transition-all placeholder:text-cusviolet/40 focus:bg-white focus:ring-2 focus:ring-cusblue/15"
                    />
                </div>

                {isLoading ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-3 text-cusviolet/75">
                        <Loader2 className="h-7 w-7 animate-spin" />
                        <p className="text-sm font-bold">Loading events...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                        <Compass className="h-10 w-10 text-cusviolet/50" />
                        <p className="font-extrabold text-cusblue">
                            {debouncedQuery
                                ? "No events match your search"
                                : "No public events yet"}
                        </p>
                        <p className="max-w-sm text-sm text-cusviolet/70">
                            {debouncedQuery
                                ? "Try a different keyword or clear the search."
                                : "Public events from hosts will appear here."}
                        </p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-3">
                        {events.map((event) => (
                            <li key={event._id}>
                                <SearchExploreEventCard event={event} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
