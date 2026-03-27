import type { Event } from "@/types/Event";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
    total?: number;
};

async function request<T>(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });

    const json = (await res.json()) as ApiResponse<T>;

    if (!res.ok || !json.success) {
        throw new Error(json.message || "Request failed");
    }

    return json;
}

export async function getJoinedEvents() {
    const json = await request<Event[]>("/event-memberships/joined");
    return json.data || [];
}

export async function joinEvent(eventId: string) {
    const json = await request<{ eventId: string; userId: string }>(
        "/event-memberships/join",
        {
            method: "POST",
            body: JSON.stringify({ eventId }),
        },
    );
    return json.data;
}
