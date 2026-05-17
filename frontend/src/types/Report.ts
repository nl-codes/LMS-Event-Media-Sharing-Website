export type ReportTargetType = "Media" | "Interaction" | "User";

export type Report = {
    _id: string;
    reporterId: { _id: string; userName: string; email: string } | string;
    targetId: string;
    targetType: ReportTargetType;
    reason: string;
    description: string;
    status: "pending" | "verified" | "dismissed";
    verifiedBy?: { _id: string; userName: string; email: string } | null;
    adminReasoning?: string;
    adminAction?: "none" | "hideMedia" | "deleteComment" | "suspendUser";
    createdAt: string;
    updatedAt: string;
};
