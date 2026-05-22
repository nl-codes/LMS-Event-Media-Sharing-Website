import { Metadata } from "next";
import PricingPage from "./PricingClient";

export const metadata: Metadata = {
    title: "Pricing | LMS 24",
    description: "Compare LMS 24 event plans for free, premium, and pro galleries.",
};

export default function Page() {
    return <PricingPage />;
}
