"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Loader2,
    Search,
    ShieldAlert,
    UserCircle2,
    Users,
} from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "@/components/navigation/BackButton";
import UserAvatar from "@/components/common/UserAvatar";
import { useUser } from "@/context/UserContext";
import {
    getEventById,
    getEventParticipants,
    type Participant,
} from "@/lib/eventApi";

type GateState = "checking" | "authorized" | "unauthorized" | "not_found";

export default function ParticipantsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const eventId = params?.id ?? "";
    const { user, isInitialized } = useUser();

    const [gate, setGate] = useState<GateState>("checking");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Host-only gate (mirrors the insights page pattern). Admins can also view.
    useEffect(() => {
        if (!isInitialized || !eventId) return;
        let cancelled = false;
        (async () => {
            try {
                const ev = await getEventById(eventId);
                if (cancelled) return;
                const hostIdStr =
                    typeof ev.hostId === "string"
                        ? ev.hostId
                        : ev.hostId?._id || "";
                const isHost = !!user && hostIdStr === user._id;
                const isAdmin =
                    user?.role === "admin" || user?.role === "superadmin";
                setGate(isHost || isAdmin ? "authorized" : "unauthorized");
            } catch {
                if (!cancelled) setGate("not_found");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [eventId, user, isInitialized]);

    useEffect(() => {
        if (gate !== "authorized") return;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const data = await getEventParticipants(eventId);
                if (!cancelled) setParticipants(data);
            } catch (err) {
                if (cancelled) return;
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Failed to load participants",
                );
                setParticipants([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [eventId, gate]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return participants;
        return participants.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                p.userName.toLowerCase().includes(q),
        );
    }, [participants, search]);

    const registeredCount = participants.filter(
        (p) => p.type === "registered",
    ).length;
    const guestCount = participants.length - registeredCount;

    if (gate === "checking") {
        return (
            <main className="min-h-screen bg-cuscream px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-4xl">
                    <BackButton label="Back to Event" />
                    <div className="mt-10 flex items-center justify-center gap-3 text-cusviolet/75">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm font-bold">
                            Checking access...
                        </span>
                    </div>
                </div>
            </main>
        );
    }

    if (gate !== "authorized") {
        return (
            <main className="min-h-screen bg-cuscream px-4 py-8 sm:px-8">
                <div className="mx-auto max-w-4xl">
                    <BackButton label="Back to Event" />
                    <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/40 bg-white/60 px-6 py-12 text-center shadow-xl shadow-cusblue/5 backdrop-blur-md">
                        <ShieldAlert className="h-10 w-10 text-cusviolet/60" />
                        <h2 className="text-2xl font-extrabold text-cusblue">
                            {gate === "not_found"
                                ? "Event not found"
                                : "You're not the host"}
                        </h2>
                        <p className="max-w-md text-sm text-cusviolet/75">
                            {gate === "not_found"
                                ? "This event no longer exists or you don't have access to it."
                                : "Only the event host can view the participant list."}
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-cuscream px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-4xl">
                <BackButton label="Back to Event" />

                <header className="mt-5">
                    <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                        Event participants
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-cusblue sm:text-4xl">
                        Everyone in this event
                    </h1>
                    {!loading && (
                        <p className="mt-2 text-sm text-cusviolet/70">
                            {registeredCount} registered
                            {guestCount > 0 && ` · ${guestCount} guest${guestCount === 1 ? "" : "s"}`}
                        </p>
                    )}
                </header>

                <div className="mt-6 relative">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cusblue/35" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or username..."
                        className="h-13 w-full rounded-2xl border border-cusblue/10 bg-white/70 py-3 pl-12 pr-4 text-sm font-medium text-cusblue outline-none transition-all placeholder:text-cusviolet/40 focus:bg-white focus:ring-2 focus:ring-cusblue/15"
                    />
                </div>

                <section className="mt-6 rounded-3xl border border-white/40 bg-white/60 p-3 shadow-xl shadow-cusblue/5 backdrop-blur-md sm:p-4">
                    {loading ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-3">
                            <Loader2 className="h-7 w-7 animate-spin text-cusblue/60" />
                            <p className="text-sm font-bold text-cusviolet/75">
                                Loading participants...
                            </p>
                        </div>
                    ) : participants.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                            <Users className="h-8 w-8 text-cusviolet/50" />
                            <p className="font-extrabold text-cusblue">
                                No participants yet
                            </p>
                            <p className="text-sm text-cusviolet/70">
                                Nobody has joined this event yet. Share your QR
                                code to get started.
                            </p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="py-10 text-center text-sm font-bold text-cusviolet/60">
                            No participants match &quot;{search}&quot;.
                        </p>
                    ) : (
                        <ul className="flex flex-col gap-1">
                            {filtered.map((p) => (
                                <ParticipantRow
                                    key={`${p.type}-${p.id}`}
                                    participant={p}
                                    onClick={
                                        p.type === "registered"
                                            ? () =>
                                                  router.push(
                                                      `/home/profile/${p.id}/others`,
                                                  )
                                            : undefined
                                    }
                                />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}

function ParticipantRow({
    participant,
    onClick,
}: {
    participant: Participant;
    onClick?: () => void;
}) {
    const isRegistered = participant.type === "registered";
    const interactive = !!onClick;

    return (
        <li>
            <button
                type="button"
                onClick={onClick}
                disabled={!interactive}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                    interactive
                        ? "hover:bg-white cursor-pointer"
                        : "cursor-default"
                }`}>
                {isRegistered ? (
                    <UserAvatar
                        src={participant.profilePicture}
                        name={participant.name}
                        size="small"
                    />
                ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cusviolet/15 text-cusviolet">
                        <UserCircle2 className="h-5 w-5" />
                    </span>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-extrabold text-cusblue">
                            {participant.name || "Unknown"}
                        </p>
                        {!isRegistered && (
                            <span className="rounded-full bg-cusviolet/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-cusviolet">
                                Guest
                            </span>
                        )}
                    </div>
                    {isRegistered && participant.userName && (
                        <p className="truncate text-xs text-cusviolet/70">
                            @{participant.userName}
                        </p>
                    )}
                </div>

                {interactive && (
                    <span className="text-xs font-bold text-cusviolet/50">
                        View →
                    </span>
                )}
            </button>
        </li>
    );
}
