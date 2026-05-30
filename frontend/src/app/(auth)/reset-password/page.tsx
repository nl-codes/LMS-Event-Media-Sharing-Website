import { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
    title: "Reset Password | LMS 24",
    description: "Set a new password and restore secure access to LMS 24.",
};

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordClient />
        </Suspense>
    );
}
