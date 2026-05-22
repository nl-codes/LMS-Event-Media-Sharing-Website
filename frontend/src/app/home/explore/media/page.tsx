import { Metadata } from "next";
import ExploreMediaPage from "./ExploreMediaClient";

export const metadata: Metadata = {
    title: "Explore Media | LMS 24",
    description: "Browse public event media shared through LMS 24.",
};

export default function Page() {
    return <ExploreMediaPage />;
}
