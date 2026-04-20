import { Metadata } from "next";
import ProfileCard from "./ProfileCard";
import BackButton from "@/components/navigation/BackButton";

export const metadata: Metadata = {
    title: "View Profile | LMS 24",
    description: "See your profile details",
};

export default function ProfileViewPage() {
    return (
        <main className="min-h-[60vh] bg-cuscream px-4 py-8">
            <section className="max-w-xl w-full mx-auto">
                <div className="mb-6 flex flex-row items-center gap-4">
                    <BackButton label="Back" />
                </div>
                <ProfileCard />
            </section>
        </main>
    );
}
