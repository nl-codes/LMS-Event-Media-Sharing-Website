import { Metadata } from "next";
import PublicEventPage from "./PublicEventClient";

export const metadata: Metadata = {
    title: "Event Details | LMS 24",
    description: "View event details and join a shared LMS 24 event gallery.",
};

export default function Page() {
    return <PublicEventPage />;
}
