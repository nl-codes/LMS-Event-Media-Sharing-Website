import { Metadata } from "next";
import AdminInsightsPage from "./AdminInsightsClient";

export const metadata: Metadata = {
    title: "Admin Insights | LMS 24",
    description: "View LMS 24 analytics for users, events, and media growth.",
};

export default function Page() {
    return <AdminInsightsPage />;
}
