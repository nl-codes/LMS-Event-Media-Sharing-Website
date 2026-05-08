"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BadgeCheck,
    LayoutDashboard,
    ShieldCheck,
    UserCog,
} from "lucide-react";
import clsx from "clsx";
import LogoutButton from "@/components/buttons/LogoutButton";

const navItems = [
    { href: "/superadmin/home", label: "Admins", icon: LayoutDashboard },
    { href: "/superadmin/admin/approve", label: "Approvals", icon: BadgeCheck },
    { href: "/superadmin/admin/manage", label: "Manage", icon: UserCog },
];

export default function SuperadminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-full lg:w-72 lg:min-h-screen bg-white/60 backdrop-blur-md border-b lg:border-b-0 lg:border-r border-cusblue/10 shadow-xl shadow-cusblue/5">
            <div className="p-6 lg:sticky lg:top-0">
                <Link
                    href="/superadmin/home"
                    className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-cusblue to-cusviolet text-cuscream shadow-lg shadow-cusblue/20">
                        <ShieldCheck className="h-6 w-6" />
                    </span>
                    <span>
                        <span className="block text-xl font-extrabold text-cusblue tracking-tight">
                            Superadmin
                        </span>
                        <span className="block text-xs font-bold uppercase tracking-widest text-cusviolet/60">
                            Control Center
                        </span>
                    </span>
                </Link>

                <nav className="mt-8 flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active =
                            pathname === item.href ||
                            pathname.startsWith(`${item.href}/`);

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
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-4 lg:mt-6">
                    <LogoutButton redirectTo="/admin/login" />
                </div>
            </div>
        </aside>
    );
}
