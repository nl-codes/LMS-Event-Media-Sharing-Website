import { type Report } from "@/types/Report";
import EventPrivacyStatus from "@/components/events/EventPrivacyStatus";
import EventStatusLabel from "@/components/events/EventStatusLabel";
import EventTierStatus from "@/components/events/EventTierStatus";

type EventMeta = {
    eventName?: string;
    tier?: string;
    privacy?: "public" | "private";
    startTime?: string;
    endTime?: string;
    status?: string;
};

type Props = {
    report: Report;
    event?: EventMeta | null;
};

export default function ReportHeader({ report, event }: Props) {
    return (
        <header className="mt-5 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-cusviolet/70">
                        Report ID
                    </p>
                    <h1 className="mt-1 break-all text-xl font-black text-cusblue">
                        {report._id}
                    </h1>
                </div>
                <span
                    className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest ${
                        report.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : report.status === "verified"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                    }`}>
                    {report.status}
                </span>
            </div>

            {event && (
                <div className="mt-5 rounded-2xl border border-cusblue/10 bg-cuscream/30 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                        Event
                    </p>
                    <p className="mt-1 text-lg font-extrabold text-cusblue">
                        {event.eventName || "Untitled event"}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                        {event.startTime && event.endTime && (
                            <EventStatusLabel
                                startTime={event.startTime}
                                endTime={event.endTime}
                            />
                        )}
                        {event.privacy && (
                            <EventPrivacyStatus
                                isPublic={event.privacy === "public"}
                                showText
                                size={15}
                            />
                        )}
                        {event.tier && <EventTierStatus tier={event.tier} />}
                    </div>
                </div>
            )}

            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                        Reason
                    </dt>
                    <dd className="mt-1 font-bold text-cusblue">
                        {report.reason}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                        Target Type
                    </dt>
                    <dd className="mt-1 font-bold text-cusblue">
                        {report.targetType}
                    </dd>
                </div>
                <div className="sm:col-span-2">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                        Description
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                        {report.description || "No description"}
                    </dd>
                </div>
            </dl>
        </header>
    );
}
