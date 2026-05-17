"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Flag } from "lucide-react";
import {
    AdminShell,
    EmptyState,
    LoadingBlock,
    PageHeader,
    StatusBadge,
    formatDateTime,
} from "@/components/admin/AdminShared";
import { listReports } from "@/lib/reportApi";
import { type Report } from "@/types/Report";

type StatusFilter = "pending" | "verified" | "dismissed" | "all";
type TypeFilter = "all" | "Media" | "Interaction" | "User";

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await listReports({
                status: statusFilter === "all" ? undefined : statusFilter,
                targetType: typeFilter === "all" ? undefined : typeFilter,
            });
            setReports(data);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to load reports",
            );
        } finally {
            setLoading(false);
        }
    }, [statusFilter, typeFilter]);

    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(
        () => ({
            pending: reports.filter((r) => r.status === "pending").length,
            verified: reports.filter((r) => r.status === "verified").length,
            dismissed: reports.filter((r) => r.status === "dismissed").length,
        }),
        [reports],
    );

    return (
        <AdminShell>
            <PageHeader
                eyebrow="Moderation"
                title="Reporting Queue"
                description="Review reports filed by users. Investigate the content, then verify with an action or dismiss with reasoning."
            />

            <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-cusblue/10">
                    {(["pending", "verified", "dismissed", "all"] as const).map(
                        (s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatusFilter(s)}
                                className={`rounded-xl px-4 py-2 text-xs font-extrabold uppercase tracking-widest transition ${
                                    statusFilter === s
                                        ? "bg-linear-to-r from-cusblue to-cusviolet text-white shadow"
                                        : "text-cusviolet/70 hover:text-cusblue"
                                }`}>
                                {s}
                            </button>
                        ),
                    )}
                </div>

                <div className="inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-cusblue/10">
                    {(["all", "Media", "Interaction", "User"] as const).map(
                        (t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTypeFilter(t)}
                                className={`rounded-xl px-3 py-2 text-xs font-extrabold uppercase tracking-widest transition ${
                                    typeFilter === t
                                        ? "bg-cusblue text-white shadow"
                                        : "text-cusviolet/70 hover:text-cusblue"
                                }`}>
                                {t === "Interaction" ? "Comment" : t}
                            </button>
                        ),
                    )}
                </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-3">
                {(
                    [
                        ["Pending", counts.pending, "text-amber-600"],
                        ["Verified", counts.verified, "text-emerald-600"],
                        ["Dismissed", counts.dismissed, "text-slate-500"],
                    ] as const
                ).map(([label, count, color]) => (
                    <div
                        key={label}
                        className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-cusblue/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                            {label}
                        </p>
                        <p
                            className={`mt-2 text-3xl font-black tracking-tight ${color}`}>
                            {count}
                        </p>
                    </div>
                ))}
            </div>

            {loading ? (
                <LoadingBlock label="Loading reports..." />
            ) : reports.length === 0 ? (
                <EmptyState
                    icon={<Flag className="h-7 w-7" />}
                    title="No reports here"
                    description="When users file reports they will show up in this queue."
                />
            ) : (
                <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-cusblue/10">
                    <table className="min-w-full">
                        <thead className="bg-cuscream/60">
                            <tr className="text-left text-[10px] font-black uppercase tracking-widest text-cusviolet/70">
                                <th className="px-5 py-3">Reason</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">Reporter</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3">Filed</th>
                                <th className="px-5 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cusblue/5 text-sm">
                            {reports.map((r) => {
                                const reporter =
                                    typeof r.reporterId === "object"
                                        ? r.reporterId
                                        : null;
                                return (
                                    <tr
                                        key={r._id}
                                        className="hover:bg-cuscream/30">
                                        <td className="px-5 py-4">
                                            <p className="font-extrabold text-cusblue">
                                                {r.reason}
                                            </p>
                                            {r.description && (
                                                <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                                                    {r.description}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-cusblue/5 px-3 py-1 text-xs font-bold text-cusblue">
                                                {r.targetType === "Interaction"
                                                    ? "Comment"
                                                    : r.targetType}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-cusviolet">
                                            {reporter?.userName || "Unknown"}
                                            <p className="text-xs text-slate-400">
                                                {reporter?.email}
                                            </p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <StatusBadge
                                                status={
                                                    r.status as
                                                        | "pending"
                                                        | "active"
                                                        | "suspended"
                                                }
                                            />
                                        </td>
                                        <td className="px-5 py-4 text-xs text-slate-500">
                                            {formatDateTime(r.createdAt)}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <Link
                                                href={`/report/${r._id}`}
                                                className="rounded-2xl bg-linear-to-r from-cusblue to-cusviolet px-4 py-2 text-xs font-extrabold uppercase tracking-widest text-white shadow transition hover:scale-[1.02]">
                                                Review
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </AdminShell>
    );
}
