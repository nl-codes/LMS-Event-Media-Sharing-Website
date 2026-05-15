"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ShieldX, UserCog } from "lucide-react";
import {
    EmptyState,
    LoadingBlock,
    PageHeader,
    SearchField,
    StatusBadge,
    SuperadminShell,
    formatDate,
} from "@/components/admin/AdminShared";
import { listAdmins, suspendAdmin, unsuspendAdmin } from "@/lib/adminApi";
import type { AdminAccount } from "@/types/Admin";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";

const DEFAULT_SUSPEND_REASON = "Suspended by superadmin review";
const DEFAULT_UNSUSPEND_REASON = "Restored by superadmin review";

export default function SuperAdminManageAdminPage() {
    const [admins, setAdmins] = useState<AdminAccount[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const loadAdmins = useCallback(async () => {
        try {
            setLoading(true);
            const data = await listAdmins(search);
            setAdmins(
                data.filter((admin) => admin.adminRequestStatus !== "pending"),
            );
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadAdmins();
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [loadAdmins]);

    const onToggleStatus = (admin: AdminAccount) => {
        const isSuspended = admin.status === "suspended";
        openConfirmationDialog({
            title: isSuspended ? "Unsuspend admin?" : "Suspend admin?",
            message: isSuspended
                ? `${admin.userName} will regain admin dashboard access.`
                : `${admin.userName} will lose admin dashboard access.`,
            confirmText: isSuspended ? "Unsuspend Admin" : "Suspend Admin",
            cancelText: "Cancel",
            isDanger: !isSuspended,
            onConfirm: async () => {
                const toastId = toast.loading(
                    isSuspended ? "Restoring admin..." : "Suspending admin...",
                );
                try {
                    if (isSuspended) {
                        await unsuspendAdmin(admin._id, DEFAULT_UNSUSPEND_REASON);
                    } else {
                        await suspendAdmin(admin._id, DEFAULT_SUSPEND_REASON);
                    }
                    await loadAdmins();
                    toast.success("Admin updated", { id: toastId });
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
                eyebrow="Admin management"
                title="Manage admins"
                description="Suspend active admins or restore suspended admin accounts."
                action={
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder="Search admins"
                    />
                }
            />

            {loading ? (
                <LoadingBlock label="Loading admins..." />
            ) : admins.length === 0 ? (
                <EmptyState
                    icon={<UserCog className="h-8 w-8" />}
                    title="No manageable admins"
                    description="Approved and suspended admins will appear here."
                />
            ) : (
                <div className="overflow-hidden rounded-3xl border border-cusblue/10 bg-white/60 shadow-xl shadow-cusblue/5">
                    {admins.map((admin) => (
                        <div
                            key={admin._id}
                            className="flex flex-col gap-4 border-b border-cusblue/10 p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-lg font-extrabold text-cusblue">
                                        {admin.userName}
                                    </h2>
                                    <StatusBadge status={admin.status} />
                                    <StatusBadge
                                        status={admin.adminRequestStatus}
                                    />
                                </div>
                                <p className="mt-1 text-sm text-cusviolet/70">
                                    {admin.email}
                                </p>
                                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-cusviolet/45">
                                    Joined {formatDate(admin.createdAt)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onToggleStatus(admin)}
                                disabled={admin.status === "pending"}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cusblue/10 bg-white px-4 py-3 text-sm font-bold text-cusblue transition-all hover:bg-cusblue hover:text-cuscream disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-white disabled:hover:text-cusblue">
                                <ShieldX className="h-4 w-4" />
                                {admin.status === "suspended"
                                    ? "Unsuspend"
                                    : "Suspend"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </SuperadminShell>
    );
}
