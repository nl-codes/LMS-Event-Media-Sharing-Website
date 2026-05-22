"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MessageSquareWarning, X, CheckCircle2 } from "lucide-react";
import {
    AdminShell,
    EmptyState,
    LoadingBlock,
    PageHeader,
    formatDateTime,
} from "@/components/admin/AdminShared";
import {
    getAppealCounts,
    listAppeals,
    approveAppeal,
    rejectAppeal,
} from "@/lib/reportApi";
import { type Appeal, type AppealStatus } from "@/types/Appeal";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

type ActionModal = {
    appeal: Appeal;
    type: "approve" | "reject";
};

type Counts = { pending: number; approved: number; rejected: number };

export default function AdminAppealsPage() {
    const [appeals, setAppeals] = useState<Appeal[]>([]);
    const [counts, setCounts] = useState<Counts>({
        pending: 0,
        approved: 0,
        rejected: 0,
    });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
    const [modal, setModal] = useState<ActionModal | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadCounts = useCallback(async () => {
        try {
            setCounts(await getAppealCounts());
        } catch {
            // non-fatal
        }
    }, []);

    const loadAppeals = useCallback(async () => {
        try {
            setLoading(true);
            setAppeals(await listAppeals(statusFilter));
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to load appeals",
            );
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        void loadCounts();
        void loadAppeals();
    }, [loadCounts, loadAppeals]);

    const openModal = (appeal: Appeal, type: "approve" | "reject") => {
        setAdminNote("");
        setModal({ appeal, type });
    };

    const closeModal = () => setModal(null);

    const handleAction = async () => {
        if (!modal) return;
        try {
            setSubmitting(true);
            if (modal.type === "approve") {
                await approveAppeal(modal.appeal._id, adminNote);
                toast.success(
                    "Appeal approved — user unsuspended and notified via email",
                );
            } else {
                await rejectAppeal(modal.appeal._id, adminNote);
                toast.success("Appeal rejected — user notified via email");
            }
            closeModal();
            // Refresh both counts and list after action
            await Promise.all([loadCounts(), loadAppeals()]);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Action failed");
        } finally {
            setSubmitting(false);
        }
    };

    const statusBadge = (status: AppealStatus) => {
        const styles: Record<AppealStatus, string> = {
            pending: "bg-amber-50 text-amber-700 border border-amber-100",
            approved:
                "bg-emerald-50 text-emerald-700 border border-emerald-100",
            rejected: "bg-rose-50 text-rose-700 border border-rose-100",
        };
        return (
            <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${styles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <AdminShell>
            <PageHeader
                eyebrow="Moderation"
                title="Appeal Review"
                description="Review unsuspension appeals filed by suspended users. Approve to reinstate their account or reject with a note — the user will be notified by email in both cases."
            />

            {/* Counts — always reflect global totals, not current filter */}
            <div className="mb-6 grid grid-cols-3 gap-3">
                {(
                    [
                        ["Pending", counts.pending, "text-amber-600"],
                        ["Approved", counts.approved, "text-emerald-600"],
                        ["Rejected", counts.rejected, "text-rose-600"],
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

            {/* Filter tabs */}
            <div className="mb-6 inline-flex rounded-2xl bg-white p-1 shadow-sm ring-1 ring-cusblue/10">
                {(["pending", "approved", "rejected", "all"] as const).map(
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

            {loading ? (
                <LoadingBlock label="Loading appeals..." />
            ) : appeals.length === 0 ? (
                <EmptyState
                    icon={<MessageSquareWarning className="h-7 w-7" />}
                    title="No appeals"
                    description="When suspended users file appeals they will appear here."
                />
            ) : (
                <div className="space-y-4">
                    {appeals.map((appeal) => (
                        <div
                            key={appeal._id}
                            className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-cusblue/10">
                            <div className="flex flex-wrap items-start justify-between gap-4 p-6">
                                {/* User info */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cusviolet/10 text-sm font-black text-cusviolet">
                                            {(appeal.userId?.userName || "U")
                                                .slice(0, 1)
                                                .toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-cusblue">
                                                {appeal.userId?.userName ||
                                                    "Unknown"}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {appeal.email}
                                            </p>
                                        </div>
                                    </div>

                                    {appeal.userId?.adminActionReason && (
                                        <div className="ml-[52px] rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                                            <span className="font-bold">
                                                Suspension reason:
                                            </span>{" "}
                                            {appeal.userId.adminActionReason}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {statusBadge(appeal.status)}
                                    <span className="text-xs text-slate-400">
                                        {formatDateTime(appeal.createdAt)}
                                    </span>
                                </div>
                            </div>

                            {/* Appeal message */}
                            <div className="border-t border-cusblue/5 bg-cuscream/40 px-6 py-4">
                                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                    Appeal message
                                </p>
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                                    {appeal.appealMessage}
                                </p>
                            </div>

                            {/* Verdict section (resolved appeals) */}
                            {appeal.status !== "pending" && (
                                <div className="border-t border-cusblue/5 px-6 py-4">
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                        Admin note
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {appeal.adminNote || "No note provided"}
                                    </p>
                                    {appeal.reviewedBy && (
                                        <p className="mt-1 text-xs text-slate-400">
                                            Reviewed by{" "}
                                            {appeal.reviewedBy.userName}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Action buttons — pending only */}
                            {appeal.status === "pending" && (
                                <div className="flex gap-3 border-t border-cusblue/5 px-6 py-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openModal(appeal, "approve")
                                        }
                                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-emerald-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openModal(appeal, "reject")
                                        }
                                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-extrabold text-red-600 transition hover:bg-red-100">
                                        <X className="h-4 w-4" />
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Action confirmation modal */}
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
                    onClick={closeModal}
                    role="presentation">
                    <div
                        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true">
                        <div
                            className={`flex items-center justify-between px-5 py-4 text-white ${
                                modal.type === "approve"
                                    ? "bg-emerald-500"
                                    : "bg-rose-500"
                            }`}>
                            <div className="flex items-center gap-2">
                                {modal.type === "approve" ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                    <X className="h-5 w-5" />
                                )}
                                <h2 className="text-lg font-black">
                                    {modal.type === "approve"
                                        ? "Approve appeal"
                                        : "Reject appeal"}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={submitting}
                                className="rounded-full p-2 transition hover:bg-white/15 disabled:opacity-60"
                                aria-label="Close">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <p className="text-sm text-slate-600">
                                {modal.type === "approve"
                                    ? `This will unsuspend ${modal.appeal.userId?.userName} and send them an approval email.`
                                    : `This will send ${modal.appeal.userId?.userName} a rejection email. Their account remains suspended.`}
                            </p>

                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-cusviolet">
                                    Admin note{" "}
                                    <span className="font-normal normal-case tracking-normal text-slate-400">
                                        (optional — included in email)
                                    </span>
                                </label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) =>
                                        setAdminNote(e.target.value)
                                    }
                                    rows={3}
                                    placeholder={
                                        modal.type === "approve"
                                            ? "e.g. We reviewed your appeal and are reinstating your account."
                                            : "e.g. Your appeal was rejected due to repeated violations."
                                    }
                                    className="w-full resize-none rounded-2xl border border-cusblue/15 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cusviolet focus:ring-4 focus:ring-cusviolet/10"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={submitting}
                                    className="rounded-2xl border border-cusblue/20 bg-white px-4 py-2 text-sm font-bold text-cusblue transition hover:bg-cuscream disabled:opacity-60">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleAction()}
                                    disabled={submitting}
                                    className={`rounded-2xl px-5 py-2 text-sm font-extrabold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                        modal.type === "approve"
                                            ? "bg-emerald-500 hover:bg-emerald-600"
                                            : "bg-rose-500 hover:bg-rose-600"
                                    }`}>
                                    {submitting
                                        ? "Processing..."
                                        : modal.type === "approve"
                                          ? "Approve & notify"
                                          : "Reject & notify"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}
