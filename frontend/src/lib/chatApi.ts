import type { ChatMessage } from "@/types/Chat";

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL;

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

export async function getRecentChatMessages(eventId: string, limit = 50) {
    const json = await request<ChatMessage[]>(
        `/chats/${eventId}/recent?limit=${limit}`,
    );
    return json.data || [];
}

export async function getUnreadCount(eventId: string) {
    const json = await request<{ unreadCount: number }>(
        `/chats/${eventId}/unread`,
    );
    return json.data?.unreadCount || 0;
}

export async function markChatAsRead(eventId: string) {
    const json = await request<void>(`/chats/${eventId}/mark-as-read`, {
        method: "POST",
    });
    return json;
}

export async function getChatMessages(eventId: string, limit = 20, skip = 0) {
    const json = await request<ChatMessage[]>(
        `/chats/${eventId}?limit=${limit}&skip=${skip}`,
    );

    // Backend returns newest-first for this endpoint; normalize to oldest-first.
    return (json.data || []).reverse();
}
