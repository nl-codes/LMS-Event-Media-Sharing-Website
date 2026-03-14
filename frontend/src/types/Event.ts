export type EventStatus = "Active" | "Completed" | "Cancelled";

export interface Event {
    _id: string;
    hostId: string | { _id: string; username?: string; email?: string };
    eventName: string;
    description?: string;
    location: string;
    startTime: string;
    endTime: string;
    uniqueSlug: string;
    status: EventStatus;
    isPremium: boolean;
    participantCount?: number;
    isLive?: boolean;
    isUpcoming?: boolean;
    createdAt?: string;
    updatedAt?: string;
}
