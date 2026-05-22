import { Metadata } from "next";
import EventInsightsPage from "./EventInsightsClient";

export const metadata: Metadata = {
    title: "Event Insights | LMS 24",
    description:
        "Review engagement, membership, and media analytics for an event.",
};

export default function Page() {
    return <EventInsightsPage />;
}
