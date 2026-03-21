import type { Media } from "@/types/Media";
import { backend_url } from "@/config/backend";

const API_BASE = backend_url;

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

async function request<T>(path: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        ...options,
    });
    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || !json.success) {
        throw new Error(json.message || "Request failed");
    }
    return json;
}

export async function uploadMedia(eventId: string, formData: FormData) {
    const res = await fetch(`${API_BASE}/media/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
    });
    const json = (await res.json()) as ApiResponse<Media>;
    if (!res.ok || !json.success) {
        throw new Error(json.message || "Upload failed");
    }
    return json.data as Media;
}

export async function getGallery(eventId: string) {
    const json = await request<Media[]>(`/media/${eventId}`);
    return json.data || [];
}

export async function deleteMedia(mediaId: string) {
    const json = await request<{ success: boolean; message: string }>(
        `/media/${mediaId}`,
        {
            method: "DELETE",
        },
    );
    return json;
}

export async function toggleLike(mediaId: string) {
    const json = await request<Media>(`/media/${mediaId}/like`, {
        method: "POST",
    });
    return json.data as Media;
}

export async function getHighlights(eventId: string) {
    const json = await request<Media[]>(`/media/${eventId}/highlights`);
    return json.data || [];
}

export async function setMediaLabel(
    mediaId: string,
    label: string,
    eventId: string,
) {
    const json = await request<Media>(`/media/${mediaId}/label`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, eventId }),
    });
    return json.data as Media;
}
