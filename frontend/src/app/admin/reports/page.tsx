import { Metadata } from "next";
import AdminReportsPage from "./AdminReportsClient";

export const metadata: Metadata = {
    title: "Admin Reports | LMS 24",
    description: "Review and action user reports in the LMS 24 moderation queue.",
};

export default function Page() {
    return <AdminReportsPage />;
}
