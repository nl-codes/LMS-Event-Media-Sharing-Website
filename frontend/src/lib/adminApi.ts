import { backend_url } from "@/config/backend";
import type {
    AdminAccount,
    AdminEvent,
    AdminEventDetails,
    AdminLoginResult,
    ManagedUser,
} from "@/types/Admin";
import type { User } from "@/types/User";

type ApiResponse<T> = {
    success?: boolean;
    message?: string;
    error?: string;
    data?: T;
    count?: number;
    mfaRequired?: boolean;
};

type AdminLoginResponseData = {
    role?: "admin" | "superadmin";
    redirectTo?: string;
};

function getMessage(payload: ApiResponse<unknown>, fallback: string) {
    return payload.message || payload.error || fallback;
}

async function parseResponse<T>(response: Response, fallback: string) {
    const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

    if (!response.ok || payload.success === false) {
        throw new Error(getMessage(payload, fallback));
    }

    return payload;
}

async function request<T>(path: string, options: RequestInit = {}) {
    const response = await fetch(`${backend_url}${path}`, {
        credentials: "include",
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string> | undefined),
        },
    });

    return parseResponse<T>(response, "Admin request failed");
}

function buildQuery(params: Record<string, string | undefined>) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value?.trim()) query.set(key, value.trim());
    });
    const value = query.toString();
    return value ? `?${value}` : "";
}

export async function adminLogin(payload: {
    email: string;
    password: string;
    otp?: string;
}): Promise<AdminLoginResult> {
    const response = await fetch(`${backend_url}/admins/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const data = await parseResponse<AdminLoginResponseData>(
        response,
        "Admin login failed",
    );

    return {
        mfaRequired: Boolean(data.mfaRequired),
        message: data.message,
        role: data.data?.role,
        redirectTo: data.data?.redirectTo,
    };
}

export async function adminSignup(payload: {
    email: string;
    userName: string;
    password: string;
}) {
    const response = await request<User>("/admins/signup", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return response.data;
}

export async function getCurrentUser() {
    const response = await fetch(`${backend_url}/users/me`, {
        credentials: "include",
    });

    if (!response.ok) {
        throw new Error("Session expired. Please login again.");
    }

    return (await response.json()) as User;
}

export async function listUsers(search?: string) {
    const response = await request<ManagedUser[]>(
        `/admins/list-users${buildQuery({ search })}`,
    );
    return response.data || [];
}

export async function suspendUser(userId: string, reason: string) {
    const response = await request<ManagedUser>("/admins/suspend-user", {
        method: "POST",
        body: JSON.stringify({ userId, reason }),
    });
    return response.data;
}

export async function unsuspendUser(userId: string, reason: string) {
    const response = await request<ManagedUser>("/admins/unsuspend-user", {
        method: "POST",
        body: JSON.stringify({ userId, reason }),
    });
    return response.data;
}

export async function listEvents(search?: string, tier?: string) {
    const response = await request<AdminEvent[]>(
        `/admins/list-events${buildQuery({ search, tier })}`,
    );
    return response.data || [];
}

export async function getAdminEventDetails(eventId: string) {
    const response = await request<AdminEventDetails>(
        `/admins/event-details/${eventId}`,
    );
    return response.data;
}

export async function suspendEvent(eventId: string) {
    const response = await request<AdminEvent>(`/events/${eventId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "Cancelled" }),
    });
    return response.data;
}

export async function listAdmins(search?: string) {
    const response = await request<AdminAccount[]>(
        `/superadmins/list-admin${buildQuery({ search })}`,
    );
    return response.data || [];
}

export async function approveAdmin(adminId: string) {
    const response = await request<AdminAccount>("/superadmins/approve-admin", {
        method: "POST",
        body: JSON.stringify({ adminId }),
    });
    return response.data;
}

export async function suspendAdmin(adminId: string, reason: string) {
    const response = await request<AdminAccount>("/superadmins/suspend-admin", {
        method: "POST",
        body: JSON.stringify({ adminId, reason }),
    });
    return response.data;
}

export async function unsuspendAdmin(adminId: string, reason: string) {
    const response = await request<AdminAccount>(
        "/superadmins/unsuspend-admin",
        {
            method: "POST",
            body: JSON.stringify({ adminId, reason }),
        },
    );
    return response.data;
}
