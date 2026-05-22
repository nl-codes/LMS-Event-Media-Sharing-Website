"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import {
    EmptyState,
    LoadingBlock,
    PageHeader,
    SearchField,
    StatusBadge,
    SuperadminShell,
    formatDate,
} from "@/components/admin/AdminShared";
import { listAdmins } from "@/lib/adminApi";
import type { AdminAccount } from "@/types/Admin";

export default function SuperAdminHomePage() {
    const [admins, setAdmins] = useState<AdminAccount[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timeout = window.setTimeout(async () => {
            try {
                setLoading(true);
                setAdmins(await listAdmins(search));
            } catch (error) {
                toast.error((error as Error).message);
            } finally {
                setLoading(false);
            }
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [search]);

    const counts = useMemo(
        () => ({
            active: admins.filter((admin) => admin.status === "active").length,
            pending: admins.filter((admin) => admin.status === "pending")
                .length,
            suspended: admins.filter((admin) => admin.status === "suspended")
                .length,
        }),
        [admins],
    );

    return (
        <SuperadminShell>
            <PageHeader
                eyebrow="Superadmin dashboard"
                title="Admins"
                description="Search and review every admin account with current platform access status."
                action={
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder="Search admins"
                    />
                }
            />

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
                <StatPill label="Active" value={counts.active} />
                <StatPill label="Pending" value={counts.pending} />
                <StatPill label="Suspended" value={counts.suspended} />
            </div>

            {loading ? (
                <LoadingBlock label="Loading admins..." />
            ) : admins.length === 0 ? (
                <EmptyState
                    icon={<ShieldCheck className="h-8 w-8" />}
                    title="No admins found"
                    description="Try a different search term or clear the search field."
                />
            ) : (
                <AdminList admins={admins} />
            )}
        </SuperadminShell>
    );
}

function AdminList({ admins }: { admins: AdminAccount[] }) {
    return (
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
                            <StatusBadge status={admin.adminRequestStatus} />
                        </div>
                        <p className="mt-1 text-sm text-cusviolet/70">
                            {admin.email}
                        </p>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-cusviolet/45">
                        Joined {formatDate(admin.createdAt)}
                    </p>
                </div>
            ))}
        </div>
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
