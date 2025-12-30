import { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
    title: "Recover Password | LMS 24",
    description:
        "Request a password reset by entering your registered email address.",
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordClient />;
}
