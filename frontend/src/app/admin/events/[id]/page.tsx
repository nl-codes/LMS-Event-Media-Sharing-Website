import { Metadata } from "next";
import AdminEventDetailsPage from "./AdminEventDetailsClient";

export const metadata: Metadata = {
    title: "Admin Event Details | LMS 24",
    description: "Inspect detailed event information in the LMS 24 admin panel.",
};

export default function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return <AdminEventDetailsPage params={params} />;
}
