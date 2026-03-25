import type { Event, EventStatus } from "@/types/Event";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
    total_events?: number;
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

export async function getHostEvents() {
    const json = await request<Event[]>("/events/host-events");
    return json.data || [];
}

export async function getEventById(id: string) {
    const json = await request<Event>(`/events/details/${id}`);
    return json.data as Event;
}

export async function getEventBySlug(slug: string) {
    const json = await request<Event>(`/events/${slug}`);
    return json.data as Event;
}

export async function createEvent(payload: {
    eventName: string;
    description?: string;
    location: string;
    startTime: string;
    endTime: string;
    isPremium?: boolean;
}) {
    const json = await request<Event>("/events", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return json.data as Event;
}

export async function updateEvent(
    id: string,
    payload: Partial<{
        eventName: string;
        description: string;
        location: string;
        startTime: string;
        endTime: string;
        isPremium: boolean;
    }>,
) {
    const json = await request<Event>(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
    return json.data as Event;
}

export async function updateEventStatus(id: string, status: EventStatus) {
    const json = await request<Event>(`/events/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
    return json.data as Event;
}

export async function deleteEvent(id: string) {
    await request<{ message: string }>(`/events/${id}`, {
        method: "DELETE",
    });
}

export async function requestUploadSignature(slug: string) {
    const json = await request<{ eventStatus: unknown }>(
        `/events/${slug}/upload-check`,
        { method: "POST" },
    );
    return json;
}

export async function verifyEventAccess(eventId: string, slug?: string) {
    const headers: Record<string, string> = {};
    if (slug) {
        headers["x-event-slug"] = slug;
    }

    const json = await request<{ isRegistered: boolean }>(
        `/events/verify/${eventId}`,
        {
            method: "GET",
            headers,
        },
    );
    return json.data as { isRegistered: boolean };
}

export async function joinAsGuest(payload: {
    eventId: string;
    userName: string;
}) {
    const json = await request<{
        guest_id: string;
        userName: string;
        eventId: string;
    }>("/events/join-as-guest", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return json.data as { guest_id: string; userName: string; eventId: string };
}
