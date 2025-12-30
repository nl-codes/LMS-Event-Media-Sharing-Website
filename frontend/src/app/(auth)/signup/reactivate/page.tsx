import { Metadata } from "next";
import ReactivateClient from "./ReactivateClient";

export const metadata: Metadata = {
    title: "Reactivate Account | LMS 24",
    description: "Restore access to your account and continue using LMS 24.",
};

export default function Home() {
    return <ReactivateClient />;
}
