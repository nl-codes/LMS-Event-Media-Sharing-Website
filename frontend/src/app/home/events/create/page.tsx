import { Metadata } from "next";
import CreateEventPage from "./CreateEventClient";

export const metadata: Metadata = {
    title: "Create Event | LMS 24",
    description: "Create a new LMS 24 event and configure its sharing options.",
};

export default function Page() {
    return <CreateEventPage />;
}
