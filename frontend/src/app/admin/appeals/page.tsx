import { Metadata } from "next";
import AdminAppealsPage from "./AdminAppealsClient";

export const metadata: Metadata = {
    title: "Admin Appeals Review | LMS 24",
    description: "Review and resolve user unsuspension appeals in LMS 24.",
};

export default function Page() {
    return <AdminAppealsPage />;
}
