"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    CalendarDays,
    Flag,
    LayoutDashboard,
    Shield,
    TrendingUp,
    Users,
    MessageSquareWarning,
} from "lucide-react";
import clsx from "clsx";
import { getAppealCounts, listReports } from "@/lib/reportApi";

const navItems = [
    { href: "/admin/home", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/insights", label: "Insights", icon: TrendingUp },
    { href: "/admin/events", label: "Events", icon: CalendarDays },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/reports", label: "Reporting", icon: Flag },
    {
        href: "/admin/appeals",
        label: "Appeal Review",
        icon: MessageSquareWarning,
    },
];

const formatPendingCount = (count: number) => (count > 99 ? "99+" : count);

export default function AdminSidebar() {
    const pathname = usePathname();
    const [pendingCounts, setPendingCounts] = useState({
        reports: 0,
        appeals: 0,
    });

    useEffect(() => {
        let mounted = true;

        async function loadPendingCounts() {
            try {
                const [reports, appeals] = await Promise.all([
                    listReports({ status: "pending" }),
                    getAppealCounts(),
                ]);

                if (!mounted) return;

                setPendingCounts({
                    reports: reports.length,
                    appeals: appeals.pending,
                });
            } catch {
                if (!mounted) return;
                setPendingCounts({ reports: 0, appeals: 0 });
            }
        }

        void loadPendingCounts();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <aside className="w-full lg:w-72 lg:min-h-screen bg-white/60 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-cusblue/10 shadow-xl shadow-cusblue/5">
            <div className="p-6 lg:sticky lg:top-0">
                <Link href="/admin/home" className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cusblue to-cusviolet text-cuscream shadow-lg shadow-cusblue/20">
                        <Shield className="h-6 w-6" />
                    </span>
                    <span>
                        <span className="block text-xl font-extrabold text-cusblue tracking-tight">
                            Admin
                        </span>
                        <span className="block text-xs font-bold uppercase tracking-widest text-cusviolet/60">
                            Management
                        </span>
                    </span>
                </Link>

                <nav className="mt-8 flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);
                        const pendingCount =
                            item.href === "/admin/reports"
                                ? pendingCounts.reports
                                : item.href === "/admin/appeals"
                                  ? pendingCounts.appeals
                                  : 0;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all",
                                    active
                                        ? "bg-cusblue text-cuscream shadow-lg shadow-cusblue/15"
                                        : "text-cusviolet/75 hover:bg-cusblue/5 hover:text-cusblue",
                                )}>
                                <Icon className="h-5 w-5" />
                                <span className="flex-1 whitespace-nowrap">
                                    {item.label}
                                </span>
                                {pendingCount > 0 && (
                                    <span
                                        className={clsx(
                                            "ml-auto flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-extrabold tabular-nums",
                                            active
                                                ? "bg-cuscream text-cusblue"
                                                : "bg-cusblue text-white shadow-sm shadow-cusblue/25",
                                        )}
                                        aria-label={`${pendingCount} pending ${item.label.toLowerCase()} item${pendingCount === 1 ? "" : "s"}`}>
                                        {formatPendingCount(pendingCount)}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
