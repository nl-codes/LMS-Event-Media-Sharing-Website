import { backend_url } from "@/config/backend";
import type { Interaction } from "@/types/Interaction";

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
};

async function request<T>(path: string, options: RequestInit = {}) {
    const res = await fetch(`${backend_url}${path}`, {
        credentials: "include",
        ...options,
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || "Request failed");
    }
    return json;
}

export async function getComments(mediaId: string) {
    const json = await request<Interaction[]>(`/interactions/${mediaId}`);
    return json.data || [];
}

export async function getLikes(mediaId: string) {
    const json = await request<Interaction[]>(
        `/interactions/${mediaId}?type=like`,
    );
    return json.data || [];
}

export async function addComment(mediaId: string, content: string) {
    const json = await request<Interaction>("/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, content }),
    });
    return json.data as Interaction;
}

export async function editComment(commentId: string, content: string) {
    const json = await request<Interaction>(`/interactions/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
    return json.data as Interaction;
}

export async function deleteComment(commentId: string) {
    const json = await request<{ deletedId: string }>(
        `/interactions/${commentId}`,
        { method: "DELETE" },
    );
    return json.data;
}
