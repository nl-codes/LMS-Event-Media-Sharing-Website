export type AppealStatus = "pending" | "approved" | "rejected";
export type AppealType = "user" | "event";

export type Appeal = {
    _id: string;
    appealType?: AppealType;
    userId: {
        _id: string;
        userName: string;
        email: string;
        status: string;
        adminActionReason?: string;
    };
    eventId?: {
        _id: string;
        eventName: string;
        status: string;
        adminActionReason?: string;
        uniqueSlug?: string;
    } | null;
    email: string;
    appealMessage: string;
    status: AppealStatus;
    reviewedBy?: { _id: string; userName: string; email: string } | null;
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
};
