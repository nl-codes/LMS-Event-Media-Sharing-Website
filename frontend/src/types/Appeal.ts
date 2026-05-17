export type AppealStatus = "pending" | "approved" | "rejected";

export type Appeal = {
    _id: string;
    userId: {
        _id: string;
        userName: string;
        email: string;
        status: string;
        adminActionReason?: string;
    };
    email: string;
    appealMessage: string;
    status: AppealStatus;
    reviewedBy?: { _id: string; userName: string; email: string } | null;
    adminNote?: string;
    createdAt: string;
    updatedAt: string;
};
