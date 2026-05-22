"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { UserRoundX, Users } from "lucide-react";
import {
    AdminShell,
    EmptyState,
    LoadingBlock,
    PageHeader,
    SearchField,
    StatusBadge,
    formatDate,
} from "@/components/admin/AdminShared";
import { listUsers, suspendUser, unsuspendUser } from "@/lib/adminApi";
import type { ManagedUser } from "@/types/Admin";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";

const DEFAULT_SUSPEND_REASON = "Suspended by admin review";
const DEFAULT_UNSUSPEND_REASON = "Restored by admin review";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setUsers(await listUsers(search));
        } catch (error) {
            toast.error((error as Error).message);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadUsers();
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [loadUsers]);

    const statusCounts = useMemo(
        () => ({
            active: users.filter((user) => user.status === "active").length,
            pending: users.filter((user) => user.status === "pending").length,
            suspended: users.filter((user) => user.status === "suspended")
                .length,
        }),
        [users],
    );

    const updateUserStatus = (user: ManagedUser) => {
        const isSuspended = user.status === "suspended";
        openConfirmationDialog({
            title: isSuspended ? "Unsuspend user?" : "Suspend user?",
            message: isSuspended
                ? `${user.userName} will regain access to their account.`
                : `${user.userName} will lose account access until restored.`,
            confirmText: isSuspended ? "Unsuspend User" : "Suspend User",
            cancelText: "Cancel",
            isDanger: !isSuspended,
            onConfirm: async () => {
                const toastId = toast.loading(
                    isSuspended ? "Restoring user..." : "Suspending user...",
                );
                try {
                    if (isSuspended) {
                        await unsuspendUser(user._id, DEFAULT_UNSUSPEND_REASON);
                    } else {
                        await suspendUser(user._id, DEFAULT_SUSPEND_REASON);
                    }
                    await loadUsers();
                    toast.success("User updated", { id: toastId });
                } catch (error) {
                    toast.error((error as Error).message, { id: toastId });
                    throw error;
                }
            },
        });
    };

    return (
        <AdminShell>
            <PageHeader
                eyebrow="User moderation"
                title="Users"
                description="Search user accounts, review their status, and manage access from a single list."
                action={
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder="Search users"
                    />
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatPill label="Active" value={statusCounts.active} />
                <StatPill label="Pending" value={statusCounts.pending} />
                <StatPill label="Suspended" value={statusCounts.suspended} />
            </div>

            {loading ? (
                <LoadingBlock label="Loading users..." />
            ) : users.length === 0 ? (
                <EmptyState
                    icon={<Users className="h-8 w-8" />}
                    title="No users found"
                    description="Try a different search term or clear the search field."
                />
            ) : (
                <div className="overflow-hidden rounded-3xl border border-cusblue/10 bg-white/60 shadow-xl shadow-cusblue/5">
                    {users.map((user) => (
                        <div
                            key={user._id}
                            className="flex flex-col gap-4 border-b border-cusblue/10 p-5 last:border-b-0 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <h2 className="text-lg font-extrabold text-cusblue">
                                        {user.userName}
                                    </h2>
                                    <StatusBadge status={user.status} />
                                </div>
                                <p className="mt-1 text-sm text-cusviolet/70">
                                    {user.email}
                                </p>
                                <p className="mt-2 text-xs font-bold uppercase tracking-widest text-cusviolet/45">
                                    Updated {formatDate(user.updatedAt)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => updateUserStatus(user)}
                                disabled={user.status === "pending"}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cusblue/10 bg-white px-4 py-3 text-sm font-bold text-cusblue transition-all hover:bg-cusblue hover:text-cuscream disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-white disabled:hover:text-cusblue">
                                <UserRoundX className="h-4 w-4" />
                                {user.status === "suspended"
                                    ? "Unsuspend"
                                    : "Suspend"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </AdminShell>
    );
}

function StatPill({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-cusblue/10 bg-white/50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-widest text-cusviolet/55">
                {label}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-cusblue">{value}</p>
        </div>
    );
}
