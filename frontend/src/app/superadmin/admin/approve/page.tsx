"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { BadgeCheck, CheckCircle2 } from "lucide-react";
import {
    EmptyState,
    LoadingBlock,
    PageHeader,
    StatusBadge,
    SuperadminShell,
    formatDate,
} from "@/components/admin/AdminShared";
import { approveAdmin, listAdmins } from "@/lib/adminApi";
import type { AdminAccount } from "@/types/Admin";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";

export default function SuperAdminApproveAdminPage() {
    const [admins, setAdmins] = useState<AdminAccount[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPendingAdmins = async () => {
        try {
            setLoading(true);
            const data = await listAdmins();
            setAdmins(
                data.filter(
                    (admin) =>
                        admin.adminRequestStatus === "pending" ||
                        admin.status === "pending",
                ),
            );
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadPendingAdmins();
    }, []);

    const onApprove = (admin: AdminAccount) => {
        openConfirmationDialog({
            title: "Approve admin?",
            message: `${admin.userName} will receive admin dashboard access.`,
            confirmText: "Approve Admin",
            cancelText: "Cancel",
            onConfirm: async () => {
                const toastId = toast.loading("Approving admin...");
                try {
                    await approveAdmin(admin._id);
                    await loadPendingAdmins();
                    toast.success("Admin approved", { id: toastId });
                } catch (error) {
                    toast.error((error as Error).message, { id: toastId });
                    throw error;
                }
            },
        });
    };

    return (
        <SuperadminShell>
            <PageHeader
                eyebrow="Admin approvals"
                title="Pending admins"
                description="Review admin signup requests and approve trusted accounts."
            />

            {loading ? (
                <LoadingBlock label="Loading pending admins..." />
            ) : admins.length === 0 ? (
                <EmptyState
                    icon={<BadgeCheck className="h-8 w-8" />}
                    title="No pending requests"
                    description="New admin signup requests will appear here when they are submitted."
                />
            ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                    {admins.map((admin) => (
                        <article
                            key={admin._id}
                            className="rounded-3xl border border-cusblue/10 bg-white/60 p-5 shadow-xl shadow-cusblue/5">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2 className="text-xl font-extrabold text-cusblue">
                                    {admin.userName}
                                </h2>
                                <StatusBadge status={admin.adminRequestStatus} />
                            </div>
                            <p className="mt-2 text-sm text-cusviolet/70">
                                {admin.email}
                            </p>
                            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-cusviolet/45">
                                Requested {formatDate(admin.createdAt)}
                            </p>
                            <button
                                type="button"
                                onClick={() => onApprove(admin)}
                                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cusblue px-4 py-3 text-sm font-bold text-cuscream transition-all hover:brightness-110">
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </SuperadminShell>
    );
}
