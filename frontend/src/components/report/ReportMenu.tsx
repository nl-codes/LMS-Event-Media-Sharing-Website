"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
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
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    const toggleMenu = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            setMenuPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
        setMenuOpen((prev) => !prev);
    };

    const menuPortal =
        menuOpen && typeof document !== "undefined"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-50"
                      onClick={() => setMenuOpen(false)}
                      role="presentation">
                      <div
                          className="fixed w-40 overflow-hidden rounded-2xl border border-cusblue/10 bg-white shadow-xl"
                          style={{
                              top: menuPosition.top,
                              right: menuPosition.right,
                          }}
                          onClick={(e) => e.stopPropagation()}>
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
                  </div>,
                  document.body,
              )
            : null;

    return (
        <div
            ref={wrapperRef}
            className="relative"
            onClick={(e) => e.stopPropagation()}>
            <button
                ref={triggerRef}
                type="button"
                onClick={toggleMenu}
                className={
                    triggerClassName ??
                    "rounded-full bg-white/80 p-2 text-slate-600 shadow-sm transition hover:bg-white hover:text-cusblue"
                }
                aria-label="More options">
                <MoreVertical className="h-4 w-4" />
            </button>

            {menuPortal}

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
