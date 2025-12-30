import type { Metadata } from "next";
import { jetBrainsMono } from "@/styles/fonts";
import "@/styles/globals.css";
import CustomToast from "@/components/toast/CustomToast";

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
                <CustomToast />
                {children}
            </body>
        </html>
    );
}
