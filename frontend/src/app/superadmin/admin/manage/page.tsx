import { Metadata } from "next";
import SuperAdminManageAdminPage from "./SuperAdminManageAdminClient";

export const metadata: Metadata = {
    title: "Manage Admins | LMS 24",
    description: "Suspend, restore, and manage LMS 24 admin accounts.",
};

export default function Page() {
    return <SuperAdminManageAdminPage />;
}
