import { Metadata } from "next";
import ProfileCard from "./ProfileCard";

export const metadata: Metadata = {
    title: "View Profile | LMS 24",
    description: "See your profile details",
};

export default function ProfileViewPage() {
    return (
        <main className="flex justify-center items-center min-h-[60vh] bg-cuscream">
            <section className="max-w-xl w-full">
                <ProfileCard />
            </section>
        </main>
    );
}
