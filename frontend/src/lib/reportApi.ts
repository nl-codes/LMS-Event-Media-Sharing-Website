import { backend_url } from "@/config/backend";
import { Report, ReportTargetType } from "@/types/Report";
import { type Notification } from "@/types/Notification";
import { FlaggedMedia } from "@/types/Media";
import { Appeal } from "@/types/Appeal";

type ApiResponse<T> = {
    success?: boolean;
    message?: string;
    error?: string;
    data?: T;
    count?: number;
    unreadCount?: number;
};

async function parse<T>(response: Response, fallback: string) {
    const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;
    if (!response.ok || payload.success === false) {
        throw new Error(payload.message || payload.error || fallback);
    }
    return payload;
}

async function request<T>(path: string, init: RequestInit = {}) {
    const response = await fetch(`${backend_url}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init.headers as Record<string, string> | undefined),
        },
        ...init,
    });
    return parse<T>(response, "Request failed");
}

export type ReportDetail = {
    report: Report;
    target: unknown;
};

export async function createReport(payload: {
    targetId: string;
    targetType: ReportTargetType;
    reason: string;
    description?: string;
}) {
    const res = await request<Report>("/reports", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return res.data;
}

export async function listReports(filters?: {
    status?: string;
    targetType?: string;
}) {
    const query = new URLSearchParams();
    if (filters?.status) query.set("status", filters.status);
    if (filters?.targetType) query.set("targetType", filters.targetType);
    const suffix = query.toString() ? `?${query.toString()}` : "";

    const res = await request<Report[]>(`/reports${suffix}`);
    return res.data || [];
}

export async function getReport(reportId: string) {
    const res = await request<ReportDetail>(`/reports/${reportId}`);
    return res.data;
}

export async function verifyReport(
    reportId: string,
    payload: { reasoning: string; action: string },
) {
    const res = await request<Report>(`/reports/${reportId}/verify`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return res.data;
}

export async function dismissReport(
    reportId: string,
    payload: { reasoning: string },
) {
    const res = await request<Report>(`/reports/${reportId}/dismiss`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return res.data;
}

export async function deleteReport(reportId: string) {
    const res = await request<{ deletedId: string }>(`/reports/${reportId}`, {
        method: "DELETE",
    });
    return res.data;
}

export async function getFlaggedMedia() {
    const res = await request<FlaggedMedia[]>(`/reports/flagged-media`);
    return res.data || [];
}

export async function listNotifications(unreadOnly = false) {
    const suffix = unreadOnly ? "?unreadOnly=true" : "";
    const res = await request<Notification[]>(`/notifications${suffix}`);
    return {
        notifications: res.data || [],
        unreadCount: res.unreadCount || 0,
    };
}

export async function getUnreadCount() {
    const res = await request<{ unreadCount: number }>(
        `/notifications/unread-count`,
    );
    return res.data?.unreadCount || 0;
}

export async function markNotificationRead(notificationId: string) {
    const res = await request<Notification>(
        `/notifications/${notificationId}/read`,
        { method: "POST" },
    );
    return res.data;
}

export async function markAllNotificationsRead() {
    return request<unknown>(`/notifications/mark-all-read`, {
        method: "POST",
    });
}

export async function submitUnsuspendAppeal(payload: {
    email: string;
    appealMessage: string;
}) {
    const response = await fetch(`${backend_url}/users/unsuspend-appeal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
    };
    if (!response.ok) {
        throw new Error(data.error || "Failed to submit appeal");
    }
    return data;
}

export async function getAppealCounts() {
    const res = await request<{ pending: number; approved: number; rejected: number }>(
        `/appeals/counts`,
    );
    return res.data || { pending: 0, approved: 0, rejected: 0 };
}

export async function listAppeals(status?: string) {
    const query = status && status !== "all" ? `?status=${status}` : "";
    const res = await request<Appeal[]>(`/appeals${query}`);
    return res.data || [];
}

export async function approveAppeal(appealId: string, adminNote?: string) {
    const res = await request<Appeal>(`/appeals/${appealId}/approve`, {
        method: "POST",
        body: JSON.stringify({ adminNote: adminNote || "" }),
    });
    return res.data;
}

export async function rejectAppeal(appealId: string, adminNote?: string) {
    const res = await request<Appeal>(`/appeals/${appealId}/reject`, {
        method: "POST",
        body: JSON.stringify({ adminNote: adminNote || "" }),
    });
    return res.data;
}
