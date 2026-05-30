import { Metadata } from "next";
import { Suspense } from "react";
import TierUpgradePage from "./TierUpgradeClient";

export const metadata: Metadata = {
    title: "Tier Upgrade | LMS 24",
    description: "View different tiers alongside feature and price",
};

export default function Page() {
    return (
        <Suspense fallback={null}>
            <TierUpgradePage />
        </Suspense>
    );
}
