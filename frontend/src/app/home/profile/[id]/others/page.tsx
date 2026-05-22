import { Metadata } from "next";
import OtherProfilePage from "./OtherProfileClient";

export const metadata: Metadata = {
    title: "User Profile | LMS 24",
    description: "View another LMS 24 user's public profile and hosted events.",
};

export default function Page() {
    return <OtherProfilePage />;
}
