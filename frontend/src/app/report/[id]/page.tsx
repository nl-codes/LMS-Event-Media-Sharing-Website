"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { AlertTriangle, Download, ShieldCheck, X } from "lucide-react";
import BackButton from "@/components/navigation/BackButton";
import { useUser } from "@/context/UserContext";
import { dismissReport, getReport, verifyReport } from "@/lib/reportApi";
import { type Report } from "@/types/Report";

type ReportDetail = {
    report: Report;
    target: TargetShape | null;
};

type TargetShape = {
    _id?: string;
    mediaUrl?: string;
    mediaType?: string;
    label?: string;
    isHidden?: boolean;
    uploaderId?: { userName?: string; email?: string };
    eventId?: { eventName?: string };
    content?: string;
    author?: { userName?: string; email?: string };
    userName?: string;
    email?: string;
    status?: string;
};

const actionLabel = (targetType: string) => {
    if (targetType === "Media") return "hideMedia";
    if (targetType === "Interaction") return "deleteComment";
    return "suspendUser";
};

const actionDescription = (action: string) => {
    if (action === "hideMedia") return "Hide media from public view";
    if (action === "deleteComment") return "Permanently delete the comment";
    if (action === "suspendUser") return "Suspend the offending user account";
    return "";
};

export default function ReportDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const reportId = params.id;
    const { user, isInitialized } = useUser();
    const [detail, setDetail] = useState<ReportDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [reasoning, setReasoning] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getReport(reportId);
            setDetail(data as ReportDetail);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to load report",
            );
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        if (reportId) load();
    }, [reportId, load]);

    if (!isInitialized || loading) {
        return (
            <main className="min-h-screen bg-cuscream px-4 py-8 text-cusblue">
                <div className="mx-auto max-w-4xl">
                    <BackButton label="Back" />
                    <div className="mt-8 h-64 animate-pulse rounded-3xl bg-white/70" />
                </div>
            </main>
        );
    }

    if (!detail) {
        return (
            <main className="min-h-screen bg-cuscream px-4 py-8 text-cusblue">
                <div className="mx-auto max-w-4xl">
                    <BackButton label="Back" />
                    <p className="mt-8 text-lg font-semibold">
                        Report not found.
                    </p>
                </div>
            </main>
        );
    }

    const { report, target } = detail;
    const isAdmin = user?.role === "admin" || user?.role === "superadmin";
    const isPending = report.status === "pending";
    const defaultAction = actionLabel(report.targetType);

    const handleVerify = async () => {
        if (!reasoning.trim()) {
            toast.error("Reasoning is required");
            return;
        }
        try {
            setSubmitting(true);
            await verifyReport(report._id, {
                reasoning: reasoning.trim(),
                action: defaultAction,
            });
            toast.success("Report verified");
            router.push("/admin/reports");
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to verify",
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleDownload = async (url: string, label?: string) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch media");
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = objectUrl;
            const extFromType = blob.type.split("/")[1]?.split(";")[0];
            const extFromUrl = url.split("?")[0].split(".").pop();
            const ext = extFromUrl && extFromUrl.length <= 5 ? extFromUrl : extFromType || "bin";
            a.download = `${label || "reported-media"}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to download",
            );
        }
    };

    const handleDismiss = async () => {
        if (!reasoning.trim()) {
            toast.error("Reasoning is required");
            return;
        }
        try {
            setSubmitting(true);
            await dismissReport(report._id, { reasoning: reasoning.trim() });
            toast.success("Report dismissed");
            router.push("/admin/reports");
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Failed to dismiss",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-cuscream px-4 py-6 text-cusblue sm:px-8">
            <div className="mx-auto max-w-4xl">
                <BackButton label="Back" />

                <header className="mt-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                                Report ID
                            </p>
                            <h1 className="mt-1 break-all text-xl font-black text-cusblue">
                                {report._id}
                            </h1>
                        </div>
                        <span
                            className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest ${
                                report.status === "pending"
                                    ? "bg-amber-50 text-amber-700"
                                    : report.status === "verified"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-slate-100 text-slate-600"
                            }`}>
                            {report.status}
                        </span>
                    </div>

                    <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                Reason
                            </dt>
                            <dd className="mt-1 font-bold text-cusblue">
                                {report.reason}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                Target Type
                            </dt>
                            <dd className="mt-1 font-bold text-cusblue">
                                {report.targetType}
                            </dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                Description
                            </dt>
                            <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                                {report.description || "No description"}
                            </dd>
                        </div>
                    </dl>
                </header>

                {target && (
                    <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h2 className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                                Reported Content
                            </h2>
                            {report.targetType === "Media" && target.mediaUrl && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDownload(
                                            target.mediaUrl!,
                                            target.label,
                                        )
                                    }
                                    title="Download media"
                                    className="inline-flex items-center gap-2 rounded-2xl border border-cusblue/20 bg-white px-3 py-1.5 text-xs font-extrabold text-cusblue transition hover:bg-cuscream">
                                    <Download className="h-4 w-4" />
                                    Download
                                </button>
                            )}
                        </div>
                        {report.targetType === "Media" && target.mediaUrl ? (
                            <div className="space-y-3">
                                <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-slate-100">
                                    {target.mediaType === "video" ? (
                                        <video
                                            src={target.mediaUrl}
                                            controls
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <Image
                                            src={target.mediaUrl}
                                            alt={
                                                target.label || "Reported media"
                                            }
                                            fill
                                            className="object-contain"
                                            sizes="100vw"
                                        />
                                    )}
                                </div>
                                <p className="text-sm text-slate-600">
                                    Uploaded by{" "}
                                    <strong>
                                        {target.uploaderId?.userName ||
                                            "Unknown"}
                                    </strong>{" "}
                                    in event{" "}
                                    <strong>
                                        {target.eventId?.eventName || "Unknown"}
                                    </strong>
                                </p>
                                {target.isHidden && (
                                    <p className="rounded-2xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-bold text-red-600">
                                        This media is currently hidden.
                                    </p>
                                )}
                            </div>
                        ) : report.targetType === "Interaction" ? (
                            <div className="space-y-2 rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4">
                                <p className="text-sm font-black text-cusblue">
                                    {target.author?.userName || "Unknown"}
                                </p>
                                <p className="whitespace-pre-wrap text-slate-700">
                                    {target.content}
                                </p>
                            </div>
                        ) : report.targetType === "User" ? (
                            <div className="space-y-1">
                                <p className="text-lg font-black text-cusblue">
                                    {target.userName}
                                </p>
                                <p className="text-sm text-slate-600">
                                    {target.email} · {target.status}
                                </p>
                            </div>
                        ) : null}
                    </section>
                )}

                {report.status !== "pending" && (
                    <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
                        <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-cusviolet/70">
                            Admin Verdict
                        </h2>
                        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                    Verified by
                                </dt>
                                <dd className="mt-1 font-bold text-cusblue">
                                    {report.verifiedBy?.userName || "Unknown"}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                    Action
                                </dt>
                                <dd className="mt-1 font-bold text-cusblue">
                                    {report.adminAction || "none"}
                                </dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                                    Admin reasoning
                                </dt>
                                <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                                    {report.adminReasoning ||
                                        "No reasoning provided"}
                                </dd>
                            </div>
                        </dl>
                    </section>
                )}

                {isAdmin && isPending && (
                    <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
                        <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-cusviolet/70">
                            Verification
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-cusviolet">
                                    Reasoning (required)
                                </label>
                                <textarea
                                    value={reasoning}
                                    onChange={(e) =>
                                        setReasoning(e.target.value)
                                    }
                                    rows={4}
                                    placeholder="Explain your decision in detail. This will be visible to the reporter and the affected user."
                                    className="w-full resize-none rounded-2xl border border-cusblue/15 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cusviolet focus:ring-4 focus:ring-cusviolet/10"
                                />
                            </div>

                            <div className="rounded-2xl border border-cusblue/10 bg-cuscream/40 p-4 text-sm">
                                <p className="font-extrabold text-cusblue">
                                    Verifying will take action:{" "}
                                    <span className="text-rose-600">
                                        {defaultAction}
                                    </span>
                                </p>
                                <p className="mt-1 text-slate-600">
                                    {actionDescription(defaultAction)}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-rose-500 px-5 py-3 text-sm font-extrabold text-white shadow-md transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60">
                                    <AlertTriangle className="h-4 w-4" />
                                    Verify & take action
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDismiss}
                                    disabled={submitting}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-cusblue/20 bg-white px-5 py-3 text-sm font-extrabold text-cusblue transition hover:bg-cuscream disabled:opacity-60">
                                    <X className="h-4 w-4" />
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {!isAdmin && (
                    <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
                        <div className="flex items-start gap-3">
                            <ShieldCheck className="h-6 w-6 text-cusviolet" />
                            <div>
                                <p className="text-sm font-extrabold text-cusblue">
                                    Thank you for helping keep the community
                                    safe.
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Our moderation team is reviewing this
                                    report. You will be notified when a decision
                                    is made.
                                </p>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
