import { Metadata } from "next";
import { Suspense } from "react";
import EventDetailsPage from "./EventDetailsClient";

export const metadata: Metadata = {
    title: "Event Details | LMS 24",
    description: "Manage event details, privacy, capacity, and sharing tools.",
};

export default function Page() {
    return (
        <Suspense fallback={null}>
            <EventDetailsPage />
        </Suspense>
    );
}
