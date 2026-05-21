"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreVertical, Sparkles, SparklesIcon, Trash2 } from "lucide-react";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";

interface MediaOptionsMenuProps {
    mediaId: string;
    onDelete?: (mediaId: string) => void;
    /** When omitted, the highlight action does not render. */
    onToggleHighlight?: (mediaId: string, nextIsHighlight: boolean) => void;
    isHighlight?: boolean;
}

// Host-only options menu shown on hover of a MediaCard. Portals out of the
// card so the menu isn't clipped by the card's overflow-hidden. Mirrors the
// pattern used by ReportMenu for non-host viewers.
export default function MediaOptionsMenu({
    mediaId,
    onDelete,
    onToggleHighlight,
    isHighlight = false,
}: MediaOptionsMenuProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);

    const openMenu = () => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
            setMenuPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
            });
        }
        setMenuOpen((prev) => !prev);
    };

    const handleDelete = () => {
        setMenuOpen(false);
        openConfirmationDialog({
            title: "Delete this media?",
            message:
                "This action cannot be undone. The media will be removed from the gallery for everyone.",
            confirmText: "Delete",
            cancelText: "Keep",
            isDanger: true,
            onConfirm: () => onDelete?.(mediaId),
        });
    };

    const handleToggleHighlight = () => {
        setMenuOpen(false);
        onToggleHighlight?.(mediaId, !isHighlight);
    };

    const menuPortal =
        menuOpen && typeof document !== "undefined"
            ? createPortal(
                  <div
                      className="fixed inset-0 z-50"
                      onClick={() => setMenuOpen(false)}
                      role="presentation">
                      <div
                          className="fixed w-52 overflow-hidden rounded-2xl border border-cusblue/10 bg-white shadow-xl"
                          style={{
                              top: menuPosition.top,
                              right: menuPosition.right,
                          }}
                          onClick={(e) => e.stopPropagation()}>
                          {onToggleHighlight && (
                              <button
                                  type="button"
                                  onClick={handleToggleHighlight}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-cusblue transition hover:bg-cuscream">
                                  {isHighlight ? (
                                      <>
                                          <SparklesIcon className="h-4 w-4" />
                                          Remove from highlight
                                      </>
                                  ) : (
                                      <>
                                          <Sparkles className="h-4 w-4" />
                                          Add to highlight
                                      </>
                                  )}
                              </button>
                          )}
                          {onDelete && (
                              <button
                                  type="button"
                                  onClick={handleDelete}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50">
                                  <Trash2 className="h-4 w-4" />
                                  Delete media
                              </button>
                          )}
                      </div>
                  </div>,
                  document.body,
              )
            : null;

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                ref={triggerRef}
                type="button"
                onClick={openMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-slate-600 shadow-lg backdrop-blur-sm transition hover:bg-white hover:text-cusblue"
                aria-label="More options"
                title="More options">
                <MoreVertical className="h-4 w-4" />
            </button>
            {menuPortal}
        </div>
    );
}
