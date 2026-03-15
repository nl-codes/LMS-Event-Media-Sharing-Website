import SignedHeader from "@/components/headers/SignedHeader";
import { userJWTToken } from "@/types/User";
import { jwtDecode } from "jwt-decode";
import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = {
    title: "Home | LMS 24",
    description: "User Dashboard",
};

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    let userName = "";
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
        try {
            const decoded = jwtDecode<userJWTToken>(token);
            userName = decoded.userName || "";
        } catch {
            // ignore decode errors
        }
    }
    return (
        <>
            <SignedHeader userName={userName} />
            {children}
        </>
    );
}
