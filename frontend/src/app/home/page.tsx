"use client";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import RecentJoinedEvents from "@/components/events/RecentJoinedEvents";

export default function Home() {
    return (
        <main className="max-w-7xl mx-auto px-6 py-12 min-h-[85vh] flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-center">
                {/* LEFT: Welcome Content (7 columns) */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                    <div className="inline-flex items-center gap-2 bg-cusblue/5 px-4 py-2 rounded-full mb-8 animate-fade-in">
                        <Sparkles className="w-4 h-4 text-cusblue" />
                        <span className="text-xs font-bold text-cusblue uppercase tracking-widest">
                            Personal Workspace
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-black text-cusblue tracking-tighter mb-6 leading-[1.1]">
                        Welcome to your <br />
                        <span className="text-transparent bg-clip-text bg-linear-to-r from-cusblue to-cusviolet">
                            Dashboard
                        </span>
                    </h1>

                    <p className="text-cusviolet/60 text-lg max-w-lg mb-10 leading-relaxed font-medium">
                        Ready to check on your schedule or create something new?
                        Access all your hosted experiences and joined events in
                        one elegant space.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/home/events"
                            className="group flex items-center gap-3 bg-cusblue text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-[0_10px_30px_rgba(var(--cusblue-rgb),0.3)] hover:opacity-90 transition-all active:scale-95">
                            Go to My Events
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* RIGHT: Sidebar Events (5 columns) */}
                <div className="lg:col-span-5 w-full max-w-md ml-auto">
                    <RecentJoinedEvents />
                </div>
            </div>
        </main>
    );
}
