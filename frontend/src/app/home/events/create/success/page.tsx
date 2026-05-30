import { Metadata } from "next";
import { Suspense } from "react";
import EventCreationSuccessPage from "./EventCreateSuccessClient";

export const metadata: Metadata = {
    title: "Event Checkout Success | LMS 24",
    description: "Confirm payment and complete paid event creation in LMS 24.",
};

export default function Page() {
    return (
        <Suspense fallback={null}>
            <EventCreationSuccessPage />
        </Suspense>
    );
}
