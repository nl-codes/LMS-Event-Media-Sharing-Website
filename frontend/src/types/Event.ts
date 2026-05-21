export type EventStatus = "Active" | "Completed" | "Cancelled";

export type MediaDeletionStatus =
    | "active"
    | "queued"
    | "processing"
    | "completed"
    | "failed";

export interface Event {
    _id: string;
    hostId:
        | string
        | {
              _id: string;
              userName?: string;
              email?: string;
              profilePicture?: string;
          };
    eventName: string;
    thumbnail: string;
    description?: string;
    location: string;
    startTime: string;
    endTime: string;
    uniqueSlug: string;
    status: EventStatus;
    isPremium: boolean;
    tier?: "free" | "premium" | "pro";
    privacy?: "public" | "private";
    expiresAt?: string | null;
    uploadLimit?: number;
    participantCount?: number;
    isLive?: boolean;
    isUpcoming?: boolean;
    mediaRetentionDeleteAt?: string | null;
    mediaRetentionWarningStartsAt?: string | null;
    mediaDeletedAt?: string | null;
    mediaDeletionStatus?: MediaDeletionStatus;
    createdAt?: string;
    updatedAt?: string;
}
