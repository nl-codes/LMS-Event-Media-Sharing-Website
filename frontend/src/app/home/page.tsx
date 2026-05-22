import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
    title: "Home | LMS 24",
    description: "Access your LMS 24 dashboard, events, and explore tools.",
};

export default function Page() {
    return <HomeClient />;
}
