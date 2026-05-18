"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BackButton from "@/components/navigation/BackButton";
import AdminVerdict from "@/components/report/AdminVerdict";
import ReportHeader from "@/components/report/ReportHeader";
import ReportedContent, {
    type ReportedTarget,
} from "@/components/report/ReportedContent";
import VerificationForm from "@/components/report/VerificationForm";
import { useUser } from "@/context/UserContext";
import { dismissReport, getReport, verifyReport } from "@/lib/reportApi";
import { type Report } from "@/types/Report";

type ReportDetail = {
    report: Report;
    target: ReportedTarget | null;
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

                <ReportHeader report={report} />

                {target && <ReportedContent report={report} target={target} />}

                {report.status !== "pending" && (
                    <AdminVerdict report={report} />
                )}

                {isAdmin && isPending && (
                    <VerificationForm
                        reasoning={reasoning}
                        onReasoningChange={setReasoning}
                        action={defaultAction}
                        actionDescription={actionDescription(defaultAction)}
                        submitting={submitting}
                        onVerify={handleVerify}
                        onDismiss={handleDismiss}
                    />
                )}
            </div>
        </main>
    );
}
