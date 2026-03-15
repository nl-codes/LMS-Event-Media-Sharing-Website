"use client";

import { useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode, Download, X } from "lucide-react";

type QRModalProps = {
    slug: string;
    eventName: string;
    onClose: () => void;
};

export default function QRModal({ slug, eventName, onClose }: QRModalProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const qrUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/events/${slug}`;

    const handleDownload = () => {
        const canvas = canvasRef.current?.querySelector("canvas");
        if (!canvas) return;

        const padding = 24;
        const size = canvas.width;
        const total = size + padding * 2;

        const out = document.createElement("canvas");
        out.width = total;
        out.height = total + 40;
        const ctx = out.getContext("2d")!;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(canvas, padding, padding, size, size);

        ctx.fillStyle = "#1e3a5f";
        ctx.font = "bold 13px monospace";
        ctx.textAlign = "center";
        ctx.fillText(slug, total / 2, total + 24);

        const link = document.createElement("a");
        link.download = `qr-${slug}.png`;
        link.href = out.toDataURL("image/png");
        link.click();
    };

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={handleBackdrop}
            aria-modal="true"
            role="dialog"
            aria-label="Event QR Code">
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center gap-6">
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-full text-cusviolet hover:bg-cusblue/10 transition-colors"
                    aria-label="Close QR modal">
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center">
                    <div className="bg-cuscream w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <QrCode className="w-7 h-7 text-cusblue" />
                    </div>
                    <h2 className="text-xl font-bold text-cusblue leading-tight">
                        {eventName}
                    </h2>
                    <p className="text-xs text-cusviolet/60 mt-1">
                        Scan to open the event page
                    </p>
                </div>

                {/* QR Code */}
                <div
                    ref={canvasRef}
                    className="p-4 bg-white border-2 border-cusblue/10 rounded-2xl shadow-inner">
                    <QRCodeCanvas
                        value={qrUrl}
                        size={200}
                        bgColor="#ffffff"
                        fgColor="#0f2d57"
                        level="H"
                        marginSize={1}
                    />
                </div>

                {/* URL pill */}
                <p className="text-xs font-mono text-cusviolet/70 bg-cuscream px-4 py-2 rounded-full text-center break-all">
                    {qrUrl}
                </p>

                {/* Download */}
                <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 bg-cusblue text-cuscream py-3 rounded-xl font-bold hover:opacity-90 active:scale-[0.98] transition-all shadow-md">
                    <Download className="w-4 h-4" />
                    Download PNG
                </button>
            </div>
        </div>
    );
}
