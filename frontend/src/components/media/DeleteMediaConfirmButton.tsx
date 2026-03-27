"use client";

import { Trash2Icon } from "lucide-react";
import { openConfirmationDialog } from "@/components/confirm/openConfirmationDialog";

interface DeleteMediaConfirmButtonProps {
    mediaId: string;
    onConfirm?: (mediaId: string) => void;
}

export default function DeleteMediaConfirmButton({
    mediaId,
    onConfirm,
}: DeleteMediaConfirmButtonProps) {
    const openConfirmDelete = () => {
        openConfirmationDialog({
            title: "Delete this media?",
            message:
                "This action cannot be undone. The media will be removed from the gallery for everyone.",
            confirmText: "Delete",
            cancelText: "Keep",
            isDanger: true,
            onConfirm: () => onConfirm?.(mediaId),
        });
    };

    return (
        <button
            onClick={openConfirmDelete}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-400 backdrop-blur-sm transition-colors hover:bg-red-500 hover:text-white shadow-lg"
            title="Delete Media">
            <Trash2Icon className="h-4 w-4" />
        </button>
    );
}
