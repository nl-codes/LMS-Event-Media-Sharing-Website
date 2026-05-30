import { Metadata } from "next";
import { Suspense } from "react";
import ActivateAccountClient from "./ActivateClient";

export const metadata: Metadata = {
    title: "Activate Account | LMS 24",
    description: "Confirm your account to start using LMS 24.",
};

export default function Home() {
    return (
        <Suspense fallback={null}>
            <ActivateAccountClient />
        </Suspense>
    );
}
