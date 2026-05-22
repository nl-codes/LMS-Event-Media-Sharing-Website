import { Metadata } from "next";
import SuperAdminHomePage from "./SuperAdminHomeClient";

export const metadata: Metadata = {
    title: "Superadmin Dashboard | LMS 24",
    description: "Review LMS 24 admin accounts and platform access status.",
};

export default function Page() {
    return <SuperAdminHomePage />;
}
