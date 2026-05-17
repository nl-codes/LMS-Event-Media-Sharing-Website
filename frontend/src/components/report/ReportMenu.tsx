"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, MoreVertical } from "lucide-react";
import ReportModal from "./ReportModal";
import type { ReportTargetType } from "@/types/Report";

interface ReportMenuProps {
    targetId: string;
    targetType: ReportTargetType;
    targetLabel?: string;
    triggerClassName?: string;
}

export default function ReportMenu({
    targetId,
    targetType,
    targetLabel,
    triggerClassName,
}: ReportMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: MouseEvent) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [menuOpen]);

    return (
        <div
            ref={wrapperRef}
            className="relative"
            onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className={
                    triggerClassName ??
                    "rounded-full bg-white/80 p-2 text-slate-600 shadow-sm transition hover:bg-white hover:text-cusblue"
                }
                aria-label="More options">
                <MoreVertical className="h-4 w-4" />
            </button>

            {menuOpen && (
                <div className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-2xl border border-cusblue/10 bg-white shadow-xl">
                    <button
                        type="button"
                        onClick={() => {
                            setMenuOpen(false);
                            setModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                        <Flag className="h-4 w-4" />
                        Report
                    </button>
                </div>
            )}

            <ReportModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                targetId={targetId}
                targetType={targetType}
                targetLabel={targetLabel}
            />
        </div>
    );
}
