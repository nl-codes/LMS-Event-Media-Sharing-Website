"use client";

import { CheckSquare, Download, Square, Trash2 } from "lucide-react";
import clsx from "clsx";

interface SelectionActionBarProps {
    selectedCount: number;
    totalCount: number;
    onDownload: () => void;
    onDelete?: () => void;
    isUser: boolean;
}

export default function SelectionActionBar({
    selectedCount,
    totalCount,
    onDownload,
    onDelete,
    isUser,
}: SelectionActionBarProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cusblue/10 bg-white/80 p-3 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
                <div
                    className={clsx("rounded-lg p-2 text-cusblue", {
                        "bg-cusblue/10": selectedCount > 0,
                    })}>
                    {selectedCount > 0 ? (
                        <CheckSquare className="h-5 w-5" />
                    ) : (
                        <Square className="h-5 w-5" />
                    )}
                </div>
                <div>
                    <p className="mb-1 text-[10px] font-black uppercase tracking-widest leading-none text-cusviolet/50">
                        Selection Mode
                    </p>
                    <p className="text-sm font-bold leading-none text-cusblue">
                        {selectedCount} / {totalCount} Selected
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={onDownload}
                    disabled={selectedCount === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-cusblue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-cusblue/90 disabled:cursor-not-allowed disabled:opacity-50">
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Download Selected</span>
                </button>

                {isUser && onDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={selectedCount === 0}
                        className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50">
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                    </button>
                )}
            </div>
        </div>
    );
}
