export type Notification = {
    _id: string;
    recipientId: string;
    message: string;
    type: string;
    link: string;
    isRead: boolean;
    createdAt: string;
};
