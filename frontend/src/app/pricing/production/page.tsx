import { Metadata } from "next";
import ProductionPricingPage from "./ProductionPricingClient";

export const metadata: Metadata = {
    title: "Production Pricing | LMS 24",
    description:
        "Review LMS 24 production pricing tiers, upload limits, and storage rates.",
};

export default function Page() {
    return <ProductionPricingPage />;
}
