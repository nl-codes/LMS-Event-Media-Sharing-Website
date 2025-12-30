import { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
    title: "Reset Password | LMS 24",
    description: "Create a new password to regain access to your account.",
};

export default function ForgotPasswordPage() {
    return <ResetPasswordClient />;
}
