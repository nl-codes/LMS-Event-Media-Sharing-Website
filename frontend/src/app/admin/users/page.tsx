import { Metadata } from "next";
import AdminUsersPage from "./AdminUsersClient";

export const metadata: Metadata = {
    title: "Admin Users | LMS 24",
    description: "Manage LMS 24 users, account status, and access moderation.",
};

export default function Page() {
    return <AdminUsersPage />;
}
