"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import clsx from "clsx";
import { useUser } from "@/context/UserContext";
import AdminSidebar from "@/app/admin/AdminSidebar";
import SuperadminSidebar from "@/app/superadmin/SuperadminSidebar";
import type { AccountStatus, AdminRequestStatus } from "@/types/Admin";

type GuardRole = "admin" | "superadmin";

export function RoleGuard({
    role,
    children,
}: {
    role: GuardRole;
    children: ReactNode;
}) {
    const router = useRouter();
    const { user, isInitialized } = useUser();

    useEffect(() => {
        if (!isInitialized) return;

        if (!user) {
            router.replace("/admin/login");
            return;
        }

        if (user.role !== role) {
            router.replace(
                user.role === "superadmin" ? "/superadmin/home" : "/admin/login",
            );
        }
    }, [isInitialized, role, router, user]);

    if (!isInitialized || !user || user.role !== role) {
        return (
            <main className="min-h-screen bg-cuscream flex items-center justify-center text-cusblue">
                <div className="flex flex-col items-center gap-3 rounded-3xl bg-white/60 px-8 py-10 shadow-xl shadow-cusblue/5">
                    <Loader2 className="h-8 w-8 animate-spin opacity-60" />
                    <p className="font-bold">Checking access...</p>
                </div>
            </main>
        );
    }

    return children;
}

export function AdminShell({ children }: { children: ReactNode }) {
    return (
        <RoleGuard role="admin">
            <div className="min-h-screen bg-cuscream lg:flex">
                <AdminSidebar />
                <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </RoleGuard>
    );
}

export function SuperadminShell({ children }: { children: ReactNode }) {
    return (
        <RoleGuard role="superadmin">
            <div className="min-h-screen bg-cuscream lg:flex">
                <SuperadminSidebar />
                <main className="flex-1 px-5 py-8 sm:px-8 lg:px-10">
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </RoleGuard>
    );
}

export function PageHeader({
    eyebrow,
    title,
    description,
    action,
}: {
    eyebrow: string;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                    {eyebrow}
                </p>
                <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-cusblue">
                    {title}
                </h1>
                <p className="mt-2 max-w-2xl text-cusviolet/75">
                    {description}
                </p>
            </div>
            {action}
        </div>
    );
}

export function SearchField({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cusblue/35" />
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                className="h-13 w-full rounded-2xl border border-cusblue/10 bg-white/70 py-3 pl-12 pr-4 text-sm font-medium text-cusblue outline-none transition-all placeholder:text-cusviolet/40 focus:bg-white focus:ring-2 focus:ring-cusblue/15"
            />
        </div>
    );
}

export function StatusBadge({
    status,
}: {
    status: AccountStatus | AdminRequestStatus | "Active" | "Completed" | "Cancelled";
}) {
    const styles: Record<string, string> = {
        active: "bg-emerald-50 text-emerald-700 border-emerald-100",
        approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
        Active: "bg-emerald-50 text-emerald-700 border-emerald-100",
        pending: "bg-amber-50 text-amber-700 border-amber-100",
        suspended: "bg-rose-50 text-rose-700 border-rose-100",
        Cancelled: "bg-rose-50 text-rose-700 border-rose-100",
        Completed: "bg-slate-100 text-slate-600 border-slate-200",
        none: "bg-slate-100 text-slate-600 border-slate-200",
    };

    return (
        <span
            className={clsx(
                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-widest",
                styles[status] || "bg-slate-100 text-slate-600 border-slate-200",
            )}>
            {status}
        </span>
    );
}

export function EmptyState({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-cusblue/10 bg-white/35 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-cusblue/5 text-cusblue/55">
                {icon}
            </div>
            <h2 className="text-xl font-extrabold text-cusblue">{title}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-cusviolet/70">
                {description}
            </p>
        </div>
    );
}

export function LoadingBlock({ label }: { label: string }) {
    return (
        <div className="flex items-center justify-center rounded-3xl bg-white/45 py-20 text-cusblue">
            <Loader2 className="mr-3 h-6 w-6 animate-spin opacity-60" />
            <span className="font-bold">{label}</span>
        </div>
    );
}

export function formatDate(value?: string) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function formatDateTime(value?: string) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
