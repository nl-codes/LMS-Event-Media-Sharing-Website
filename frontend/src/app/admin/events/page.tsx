import { Metadata } from "next";
import AdminEventsPage from "./AdminEventsClient";

export const metadata: Metadata = {
    title: "Admin Events | LMS 24",
    description: "Review and moderate events across the LMS 24 platform.",
};

export default function Page() {
    return <AdminEventsPage />;
}
