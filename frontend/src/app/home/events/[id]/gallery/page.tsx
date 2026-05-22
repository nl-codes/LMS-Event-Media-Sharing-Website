import { Metadata } from "next";
import HostGalleryPage from "./HostGalleryClient";

export const metadata: Metadata = {
    title: "Event Gallery Management | LMS 24",
    description:
        "Upload, moderate, download, and manage media for your event gallery.",
};

export default function Page() {
    return <HostGalleryPage />;
}
