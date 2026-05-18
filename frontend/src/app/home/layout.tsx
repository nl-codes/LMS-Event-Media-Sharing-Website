import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Home | LMS 24",
    description: "User Dashboard",
};

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
