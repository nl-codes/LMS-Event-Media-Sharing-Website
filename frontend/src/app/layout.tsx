import type { Metadata } from "next";
import { jetBrainsMono } from "@/styles/fonts";
import "@/styles/globals.css";
import "react-confirm-alert/src/react-confirm-alert.css";
import CustomToast from "@/components/toast/CustomToast";
import { UserProvider } from "@/context/UserContext";
import { IdentityProvider } from "@/context/IdentityContext";

export const metadata: Metadata = {
    title: "LMS 24: Live Media Sharing 24 hours",
    description:
        "Real-time event media sharing made easy. Create groups, scan a QR code, and let participants upload and view photos instantly",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${jetBrainsMono.className} antialiased`}>
                <UserProvider>
                    <IdentityProvider>
                        <CustomToast />
                        {children}
                    </IdentityProvider>
                </UserProvider>
            </body>
        </html>
    );
}
