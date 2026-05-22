import { Metadata } from "next";
import EventPublicGallery from "./PublicGalleryClient";

export const metadata: Metadata = {
    title: "Event Gallery | LMS 24",
    description: "Browse and contribute to a shared LMS 24 event gallery.",
};

export default function Page() {
    return <EventPublicGallery />;
}
