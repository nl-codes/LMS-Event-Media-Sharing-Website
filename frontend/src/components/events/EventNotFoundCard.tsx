import BackButton from "../buttons/BackButton";

export default function EventNotFoundCard() {
    return (
        <div className="mx-auto max-w-5xl p-4">
            <div className="mb-4 flex flex-row items-center gap-4">
                <BackButton label="Back to Events" />
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/60 p-8 text-center shadow-xl backdrop-blur-md">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cusviolet">
                    Event not found
                </p>
                <h1 className="mt-3 text-3xl font-black text-cusblue">
                    This event could not be found.
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
                    The event may have been removed, or the link may be
                    incorrect.
                </p>
            </div>
        </div>
    );
}
