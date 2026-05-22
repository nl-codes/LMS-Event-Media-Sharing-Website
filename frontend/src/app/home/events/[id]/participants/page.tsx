import { Metadata } from "next";
import EventParticipantsPage from "./EventParticipantsClient";

export const metadata: Metadata = {
    title: "Event Participants | LMS 24",
    description: "View registered and guest participants for an LMS 24 event.",
};

export default function Page() {
    return <EventParticipantsPage />;
}
