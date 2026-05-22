import { Metadata } from "next";
import ReportDetailPage from "./ReportDetailClient";

export const metadata: Metadata = {
    title: "Report Review | LMS 24",
    description: "Review a reported LMS 24 item and submit a moderation decision.",
};

export default function Page() {
    return <ReportDetailPage />;
}
