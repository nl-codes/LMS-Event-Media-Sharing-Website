"use client";
import { Calendar } from "lucide-react";

export default function Home() {
    return (
        <main className="max-w-7xl mx-auto px-6 py-12 min-h-[80vh] flex flex-col items-center justify-center text-center">
            {/* Dashboard Welcome State */}
            <div className="profile-card-animate flex flex-col items-center">
                <div className="bg-cusblue/5 p-4 rounded-3xl mb-6">
                    <Calendar className="w-12 h-12 text-cusblue" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-cusblue tracking-tight mb-4">
                    Welcome to your Dashboard
                </h1>

                <p className="text-cusviolet/70 text-lg max-w-md mb-10 leading-relaxed">
                    Ready to check on your schedule or create something new?
                    Access all your hosted experiences in one place.
                </p>
            </div>
        </main>
    );
}
