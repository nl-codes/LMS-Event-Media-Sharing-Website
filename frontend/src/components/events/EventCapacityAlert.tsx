"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { getEventUsage, type EventUsage } from "@/lib/mediaApi";
import Link from "next/link";

interface EventCapacityAlertProps {
    eventId: string;
    tier?: string;
}

const NEARING_THRESHOLD = 0.8;

export default function EventCapacityAlert({
    eventId,
}: EventCapacityAlertProps) {
    const [usage, setUsage] = useState<EventUsage | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const data = await getEventUsage(eventId);
                if (!cancelled) setUsage(data);
            } catch {
                // Silently fail — upload button will handle tier limits.
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [eventId]);

    if (loading || !usage) return null;

    const ratio = usage.used / usage.maxFiles;
    const atCapacity = usage.atCapacity;
    const nearing = !atCapacity && ratio >= NEARING_THRESHOLD;

    if (!atCapacity && !nearing) return null;

    return (
        <div
            className={`rounded-2xl border p-4 shadow-sm ${
                atCapacity
                    ? "border-red-200 bg-red-50"
                    : "border-amber-200 bg-amber-50"
            }`}>
            <div className="flex items-start gap-3">
                {atCapacity ? (
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                ) : (
                    <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                )}
                <div className="flex-1 space-y-2">
                    <p
                        className={`font-extrabold ${
                            atCapacity ? "text-red-900" : "text-amber-900"
                        }`}>
                        {atCapacity
                            ? "Upload limit reached"
                            : `Storage nearing capacity (${Math.round(
                                  ratio * 100,
                              )}%)`}
                    </p>
                    <p
                        className={`text-sm ${
                            atCapacity ? "text-red-800" : "text-amber-800"
                        }`}>
                        {usage.used} of {usage.maxFiles} uploads used on the{" "}
                        <span className="font-bold">{usage.tier}</span> tier.
                    </p>
                    {atCapacity && (
                        <div className="pt-2">
                            <Link
                                href="/pricing"
                                className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700">
                                Upgrade Event →
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
