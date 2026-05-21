"use client";

import Image from "next/image";
import toast from "react-hot-toast";
import { Download } from "lucide-react";
import { type Report } from "@/types/Report";
import UserAvatar from "@/components/common/UserAvatar";

export type ReportedTarget = {
    _id?: string;
    mediaUrl?: string;
    mediaType?: string;
    label?: string;
    isHidden?: boolean;
    uploaderId?: {
        userName?: string;
        email?: string;
        profilePicture?: string;
        isGuest?: boolean;
    };
    eventId?: {
        _id?: string;
        eventName?: string;
        tier?: string;
        privacy?: "public" | "private";
        startTime?: string;
        endTime?: string;
        status?: string;
    };
    content?: string;
    author?: { userName?: string; email?: string };
    userName?: string;
    email?: string;
    status?: string;
};

type Props = {
    report: Report;
    target: ReportedTarget;
};

const downloadMedia = async (url: string, label?: string) => {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch media");
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        const extFromType = blob.type.split("/")[1]?.split(";")[0];
        const extFromUrl = url.split("?")[0].split(".").pop();
        const ext =
            extFromUrl && extFromUrl.length <= 5
                ? extFromUrl
                : extFromType || "bin";
        a.download = `${label || "reported-media"}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
    } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to download");
    }
};

export default function ReportedContent({ report, target }: Props) {
    const canDownload = report.targetType === "Media" && !!target.mediaUrl;

    return (
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                    Reported Content
                </h2>
                {canDownload && (
                    <button
                        type="button"
                        onClick={() =>
                            downloadMedia(target.mediaUrl!, target.label)
                        }
                        title="Download media"
                        className="inline-flex items-center gap-2 rounded-2xl border border-cusblue/20 bg-white px-3 py-1.5 text-xs font-extrabold text-cusblue transition hover:bg-cuscream">
                        <Download className="h-4 w-4" />
                        Download
                    </button>
                )}
            </div>

            {report.targetType === "Media" && target.mediaUrl ? (
                <div className="space-y-3">
                    <div className="relative h-80 w-full overflow-hidden rounded-2xl bg-slate-100">
                        {target.mediaType === "video" ? (
                            <video
                                src={target.mediaUrl}
                                controls
                                className="h-full w-full object-contain"
                            />
                        ) : (
                            <Image
                                src={target.mediaUrl}
                                alt={target.label || "Reported media"}
                                fill
                                className="object-contain"
                                sizes="100vw"
                            />
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span>Reported by: </span>
                        <UserAvatar
                            src={target.uploaderId?.profilePicture}
                            name={target.uploaderId?.userName}
                            size="small"
                        />
                        <div className="min-w-0">
                            <p className="flex items-center gap-2">
                                <strong className="text-cusblue">
                                    {target.uploaderId?.userName || "Unknown"}
                                </strong>
                                <span className="rounded-full bg-cusviolet/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-cusviolet">
                                    {target.uploaderId?.isGuest
                                        ? "Guest"
                                        : "User"}
                                </span>
                            </p>
                            <p className="text-xs text-slate-500">
                                in event{" "}
                                <strong>
                                    {target.eventId?.eventName || "Unknown"}
                                </strong>
                            </p>
                        </div>
                    </div>
                    {target.isHidden && (
                        <p className="rounded-2xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-bold text-red-600">
                            This media is currently hidden.
                        </p>
                    )}
                </div>
            ) : report.targetType === "Interaction" ? (
                <div className="space-y-2 rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4">
                    <p className="text-sm font-black text-cusblue">
                        {target.author?.userName || "Unknown"}
                    </p>
                    <p className="whitespace-pre-wrap text-slate-700">
                        {target.content}
                    </p>
                </div>
            ) : report.targetType === "User" ? (
                <div className="space-y-1">
                    <p className="text-lg font-black text-cusblue">
                        {target.userName}
                    </p>
                    <p className="text-sm text-slate-600">
                        {target.email} · {target.status}
                    </p>
                </div>
            ) : null}
        </section>
    );
}
