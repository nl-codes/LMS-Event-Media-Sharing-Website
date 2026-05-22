import { Metadata } from "next";
import AdminHomePage from "./AdminHomeClient";

export const metadata: Metadata = {
    title: "Admin Dashboard | LMS 24",
    description: "Monitor LMS 24 platform activity from the admin dashboard.",
};

export default function Page() {
    return <AdminHomePage />;
}
