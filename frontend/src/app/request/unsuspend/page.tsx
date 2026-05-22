import { Metadata } from "next";
import UnsuspendAppealPage from "./UnsuspendAppealClient";

export const metadata: Metadata = {
    title: "Unsuspend Appeal | LMS 24",
    description: "Submit an appeal to request restoration of a suspended LMS 24 account.",
};

export default function Page() {
    return <UnsuspendAppealPage />;
}
