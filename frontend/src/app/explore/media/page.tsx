"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Compass, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import ExploreMediaCard from "@/components/media/ExploreMediaCard";
import { getExploreMedia } from "@/lib/mediaApi";
import type { Media } from "@/types/Media";
import BackButton from "@/components/navigation/BackButton";

const PAGE_SIZE = 20;

// Fisher-Yates. We shuffle each incoming page rather than the whole list so the user's existing scroll context doesn't reshuffle out from under them on every append.
const shuffleInPlace = <T,>(arr: T[]): T[] => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

export default function ExplorePage() {
    const [items, setItems] = useState<Media[]>([]);
    // const [cursor, setCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const sentinelRef = useRef<HTMLDivElement | null>(null);
    // Refs guard against duplicate page requests when the observer fires twice
    // (which it does during fast scroll) before state has updated.
    const isFetchingRef = useRef(false);
    const cursorRef = useRef<string | null>(null);
    const hasMoreRef = useRef(true);

    const loadPage = useCallback(async (firstPage: boolean) => {
        if (isFetchingRef.current) return;
        if (!firstPage && !hasMoreRef.current) return;
        isFetchingRef.current = true;

        if (firstPage) {
            setIsLoading(true);
        } else {
            setIsFetchingMore(true);
        }

        try {
            const res = await getExploreMedia({
                cursor: firstPage ? null : cursorRef.current,
                limit: PAGE_SIZE,
            });
            setItems((prev) => {
                if (firstPage) return shuffleInPlace([...res.items]);
                // De-dupe defensively: the cursor should prevent overlap but
                // a races-with-new-uploads could occasionally include one.
                const seen = new Set(prev.map((m) => m._id));
                const fresh = res.items.filter((m) => !seen.has(m._id));
                return [...prev, ...shuffleInPlace(fresh)];
            });
            cursorRef.current = res.nextCursor;
            hasMoreRef.current = res.hasMore;
            // setCursor(res.nextCursor);
            setHasMore(res.hasMore);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to load explore feed",
            );
            hasMoreRef.current = false;
            setHasMore(false);
        } finally {
            isFetchingRef.current = false;
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, []);

    useEffect(() => {
        void loadPage(true);
    }, [loadPage]);

    // IntersectionObserver-based infinite scroll.
    useEffect(() => {
        const node = sentinelRef.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting && hasMoreRef.current) {
                    void loadPage(false);
                }
            },
            { rootMargin: "400px 0px" },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [loadPage]);

    const handleLikeChange = useCallback(
        (mediaId: string, liked: boolean, likesCount: number) => {
            setItems((prev) =>
                prev.map((m) => (m._id === mediaId ? { ...m, likesCount } : m)),
            );
            // `liked` is intentionally unused at the list level; the card owns
            // its own optimistic isLiked state.
            void liked;
        },
        [],
    );

    return (
        <main className="min-h-screen bg-cuscream px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 flex flex-row items-center gap-4">
                    <BackButton label="Back" />
                </div>
                <header className="mb-6 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cusblue to-cusviolet text-cuscream shadow-lg shadow-cusblue/20">
                        <Compass className="h-6 w-6" />
                    </span>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                            Discover
                        </p>
                        <h1 className="text-3xl font-extrabold tracking-tight text-cusblue sm:text-4xl">
                            Explore
                        </h1>
                    </div>
                </header>

                {isLoading ? (
                    <div className="flex h-60 flex-col items-center justify-center gap-3 text-cusviolet/75">
                        <Loader2 className="h-7 w-7 animate-spin" />
                        <p className="text-sm font-bold">Loading feed...</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex h-60 flex-col items-center justify-center gap-2 text-center">
                        <Compass className="h-10 w-10 text-cusviolet/50" />
                        <p className="font-extrabold text-cusblue">
                            Nothing public yet
                        </p>
                        <p className="max-w-sm text-sm text-cusviolet/70">
                            When event hosts make their events public, their
                            media shows up here.
                        </p>
                    </div>
                ) : (
                    <div className="columns-1 sm:columns-2 gap-4">
                        {items.map((media) => (
                            <ExploreMediaCard
                                key={media._id}
                                media={media}
                                onLikeChange={handleLikeChange}
                            />
                        ))}
                    </div>
                )}

                <div ref={sentinelRef} aria-hidden className="h-1" />

                {isFetchingMore && (
                    <div className="my-6 flex items-center justify-center gap-2 text-cusviolet/70">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm font-bold">
                            Loading more...
                        </span>
                    </div>
                )}

                {!isLoading && !hasMore && items.length > 0 && (
                    <p className="my-6 text-center text-sm font-bold text-cusviolet/50">
                        You&apos;ve reached the end.
                    </p>
                )}
            </div>
        </main>
    );
}
