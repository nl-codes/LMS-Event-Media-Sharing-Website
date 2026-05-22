import { Metadata } from "next";
import ProfileCreatePage from "./ProfileCreateClient";

export const metadata: Metadata = {
    title: "Create Profile | LMS 24",
    description: "Set up your LMS 24 profile information.",
};

export default function Page() {
    return <ProfileCreatePage />;
}
