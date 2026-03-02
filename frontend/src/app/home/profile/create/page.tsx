"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfileCreatePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to edit page which now handles both create and edit
        router.replace("/home/profile/edit");
    }, [router]);

    return <div className="text-center p-10">Redirecting...</div>;
}
