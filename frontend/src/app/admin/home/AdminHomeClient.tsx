"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Users, ArrowRight, ShieldCheck } from "lucide-react";
import {
    AdminShell,
    PageHeader,
    LoadingBlock,
} from "@/components/admin/AdminShared";
import { listEvents, listUsers } from "@/lib/adminApi";
import { useUser } from "@/context/UserContext";

export default function AdminHomePage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ users: 0, events: 0 });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [users, events] = await Promise.all([
                    listUsers(),
                    listEvents(),
                ]);
                setStats({ users: users.length, events: events.length });
            } finally {
                setLoading(false);
            }
        };

        void loadStats();
    }, []);

    return (
        <AdminShell>
            <PageHeader
                eyebrow="Admin dashboard"
                title={`Welcome${user?.userName ? `, ${user.userName}` : ""}`}
                description="Monitor platform users and events from one calm, focused workspace."
            />

            {loading ? (
                <LoadingBlock label="Loading dashboard..." />
            ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <DashboardCard
                        href="/admin/users"
                        icon={<Users className="h-6 w-6" />}
                        label="Users"
                        value={stats.users}
                        description="Review user status and suspend or restore access when needed."
                    />
                    <DashboardCard
                        href="/admin/events"
                        icon={<CalendarDays className="h-6 w-6" />}
                        label="Events"
                        value={stats.events}
                        description="Browse hosted events, inspect details, and take moderation actions."
                    />
                    <div className="rounded-3xl border border-cusblue/10 bg-white/55 p-6 shadow-xl shadow-cusblue/5">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cusviolet/10 text-cusviolet">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h2 className="mt-5 text-xl font-extrabold text-cusblue">
                            Access protected
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-cusviolet/70">
                            This area is available only to approved admin
                            accounts.
                        </p>
                    </div>
                </div>
            )}
        </AdminShell>
    );
}

function DashboardCard({
    href,
    icon,
    label,
    value,
    description,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    value: number;
    description: string;
}) {
    return (
        <Link
            href={href}
            className="group rounded-3xl border border-cusblue/10 bg-white/55 p-6 shadow-xl shadow-cusblue/5 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-cusblue/10">
            <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cusblue/10 text-cusblue">
                    {icon}
                </div>
                <ArrowRight className="h-5 w-5 text-cusviolet/35 transition-transform group-hover:translate-x-1 group-hover:text-cusblue" />
            </div>
            <p className="mt-5 text-sm font-black uppercase tracking-widest text-cusviolet/60">
                {label}
            </p>
            <p className="mt-2 text-4xl font-extrabold text-cusblue">{value}</p>
            <p className="mt-3 text-sm leading-relaxed text-cusviolet/70">
                {description}
            </p>
        </Link>
    );
}
