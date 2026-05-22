import { Metadata } from "next";
import SuperAdminApproveAdminPage from "./SuperAdminApproveAdminClient";

export const metadata: Metadata = {
    title: "Approve Admins | LMS 24",
    description: "Review and approve pending LMS 24 admin access requests.",
};

export default function Page() {
    return <SuperAdminApproveAdminPage />;
}
