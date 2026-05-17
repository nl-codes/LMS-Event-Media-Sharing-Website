import { backend_url } from "@/config/backend";
import type { Event } from "@/types/Event";

export type PublicProfile = {
    user: {
        _id: string;
        userName: string;
        createdAt: string;
    };
    profile: {
        firstName: string;
        lastName: string;
        bio: string;
        profilePicture: string;
        gender: string;
        country: string;
    } | null;
    createdEvents: Event[];
    joinedEvents: Event[];
};

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
    const res = await fetch(`${backend_url}/users/profile/${userId}/public`, {
        credentials: "include",
    });
    const json = (await res.json()) as {
        success: boolean;
        data?: PublicProfile;
        error?: string;
    };
    if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to load profile");
    }
    return json.data!;
}
