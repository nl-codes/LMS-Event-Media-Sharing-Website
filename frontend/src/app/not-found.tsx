import Image from "next/image";
import BackButton from "@/components/buttons/BackButton";
import pageNotFoundImage from "../../public/Page-Not-Found.png";

export default function NotFound() {
    return (
        <main className="bg-cuscream px-4 py-4 text-cusblue sm:px-6 lg:px-10">
            <div className="mx-auto flex w-full max-w-6xl flex-col">
                <div className="flex flex-row">
                    <BackButton label="Back" />
                </div>

                <section className="grid flex-1 items-center gap-10 py-6 lg:grid-cols-[0.95fr_1.05fr] lg:py-10">
                    <div className="order-2 text-center lg:order-1 lg:text-left">
                        <p className="text-xs font-black uppercase tracking-[0.25em] text-cusviolet">
                            Page not found
                        </p>
                        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
                            This page slipped out of frame.
                        </h1>
                        <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 lg:mx-0">
                            The link may be broken, moved, or no longer
                            available. Head back and continue from the last
                            place that worked.
                        </p>
                    </div>

                    <div className="order-1 lg:order-2">
                        <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-4xl border border-white/70 bg-white/60 shadow-xl ring-1 ring-cusblue/10 backdrop-blur-md">
                            <Image
                                src={pageNotFoundImage}
                                alt="Page not found illustration"
                                fill
                                priority
                                className="object-cover"
                                sizes="(min-width: 1024px) 520px, 90vw"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
