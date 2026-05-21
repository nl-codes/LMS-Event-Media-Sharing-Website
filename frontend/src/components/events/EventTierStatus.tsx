import clsx from "clsx";

export default function EventTierStatus({ tier }: { tier: string }) {
    return (
        <span
            className={clsx(
                "shrink-0 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border transition-all",
                {
                    // Free: Subtle, muted, professional
                    "bg-slate-500/10 text-slate-500 border-slate-500":
                        tier === "free",

                    // Premium: Deep, rich indigo/blue
                    "bg-indigo-600/15 text-indigo-500 border-indigo-600":
                        tier === "premium",

                    // Pro: Warm gold with a soft glow
                    "bg-amber-500/15 text-amber-600 border-amber-500":
                        tier === "pro",
                },
            )}>
            {tier}
        </span>
    );
}
