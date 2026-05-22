import { Metadata } from "next";
import MediaDetailPage from "./MediaDetailClient";

export const metadata: Metadata = {
    title: "Media Detail | LMS 24",
    description: "View, like, and comment on shared LMS 24 event media.",
};

export default function Page() {
    return <MediaDetailPage />;
}
