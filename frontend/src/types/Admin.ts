import type { EventStatus } from "./Event";

export type AdminRole = "admin" | "superadmin";
export type AccountStatus = "pending" | "active" | "suspended";
export type AdminRequestStatus = "none" | "pending" | "approved" | "suspended";
export type EventTier = "free" | "premium" | "pro";

export interface AdminAccount {
    _id: string;
    userName: string;
    email: string;
    role: "admin";
    status: AccountStatus;
    adminRequestStatus: AdminRequestStatus;
    adminActionReason?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ManagedUser {
    _id: string;
    userName: string;
    email: string;
    role: "user";
    status: AccountStatus;
    suspensionCount?: number;
    adminActionReason?: string;
    updatedAt?: string;
}

export interface AdminEventHost {
    _id: string;
    userName?: string;
    email?: string;
}

export interface AdminEvent {
    _id: string;
    hostId?: string | AdminEventHost;
    eventName: string;
    description?: string;
    location?: string;
    startTime: string;
    endTime: string;
    thumbnail?: string;
    status: EventStatus;
    tier?: EventTier;
    isPremium?: boolean;
    participantCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface AdminEventDetails {
    event: {
        _id: string;
        eventName: string;
        description?: string;
        location?: string;
        startTime: string;
        endTime: string;
        uniqueSlug?: string;
        status?: EventStatus;
        isPremium?: boolean;
        tier?: EventTier;
        uploadLimit?: number;
        thumbnail?: string;
        participantCount?: number;
        hostId?: string | AdminEventHost;
    };
    stats?: {
        participants?: number;
        uploads?: number;
    };
    uploadsSeries?: Array<{
        t: string;
        y: number;
    }>;
    bucketUnit?: string;
}

export interface AdminLoginResult {
    mfaRequired: boolean;
    message?: string;
    role?: AdminRole;
    redirectTo?: string;
    token?: string;
}
