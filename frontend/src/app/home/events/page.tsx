import { Metadata } from "next";
import EventsPage from "./EventsClient";

export const metadata: Metadata = {
    title: "My Events | LMS 24",
    description: "View, create, and manage your LMS 24 event galleries.",
};

export default function Page() {
    return <EventsPage />;
}
