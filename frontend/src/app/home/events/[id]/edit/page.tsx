import { Metadata } from "next";
import EditEventPage from "./EditEventClient";

export const metadata: Metadata = {
    title: "Edit Event | LMS 24",
    description: "Update eligible LMS 24 event details and status settings.",
};

export default function Page() {
    return <EditEventPage />;
}
