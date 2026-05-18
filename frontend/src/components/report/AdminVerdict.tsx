import { type Report } from "@/types/Report";

type Props = {
    report: Report;
};

export default function AdminVerdict({ report }: Props) {
    return (
        <section className="mt-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-cusblue/10">
            <h2 className="mb-4 text-xs font-black uppercase tracking-widest text-cusviolet/70">
                Admin Verdict
            </h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                        Verified by
                    </dt>
                    <dd className="mt-1 font-bold text-cusblue">
                        {report.verifiedBy?.userName || "Unknown"}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                        Action
                    </dt>
                    <dd className="mt-1 font-bold text-cusblue">
                        {report.adminAction || "none"}
                    </dd>
                </div>
                <div className="sm:col-span-2">
                    <dt className="text-[10px] font-bold uppercase tracking-widest text-cusviolet/60">
                        Admin reasoning
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-slate-700">
                        {report.adminReasoning || "No reasoning provided"}
                    </dd>
                </div>
            </dl>
        </section>
    );
}
