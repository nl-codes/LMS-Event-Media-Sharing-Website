import { Metadata } from "next";
import ExplorePage from "./ExploreClient";

export const metadata: Metadata = {
    title: "Explore Events | LMS 24",
    description: "Discover public LMS 24 events and shared galleries.",
};

export default function Page() {
    return <ExplorePage />;
}
