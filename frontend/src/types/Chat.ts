export interface ChatSenderRef {
    _id: string;
    userName?: string;
    email?: string;
}

export interface ChatMessage {
    _id: string;
    eventId: string;
    senderId: string | ChatSenderRef;
    senderName: string;
    senderEmail: string;
    text: string;
    createdAt: string;
}
