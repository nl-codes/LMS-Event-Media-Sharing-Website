import { Metadata } from "next";
import ProfileEditPage from "./ProfileEditClient";

export const metadata: Metadata = {
    title: "Edit Profile | LMS 24",
    description: "Update your LMS 24 profile details and profile picture.",
};

export default function Page() {
    return <ProfileEditPage />;
}
