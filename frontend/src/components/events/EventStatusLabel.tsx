"use client";

interface EventStatusLabelProps {
    startTime: string | Date;
    endTime: string | Date;
    className?: string;
}

export default function EventStatusLabel({
    startTime,
    endTime,
    className,
}: EventStatusLabelProps) {
    const now = new Date();
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const isFinished = now > endDate;
    const isLive = now >= startDate && now <= endDate;

    let statusLabel = "Upcoming Soon";
    let statusConfig = "bg-slate-100 text-slate-500";
    let dotConfig = "bg-slate-400";

    if (isLive) {
        statusLabel = "Live";
        statusConfig = "bg-green-100 text-green-700";
        dotConfig = "bg-green-500 animate-pulse";
    } else if (isFinished) {
        statusLabel = "Finished";
        statusConfig = "bg-red-100 text-red-700";
        dotConfig = "bg-red-500";
    }

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusConfig}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${dotConfig}`} />
                {statusLabel}
            </span>
        </div>
    );
}
