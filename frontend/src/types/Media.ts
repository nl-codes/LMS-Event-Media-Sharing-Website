export interface Media {
    _id: string;
    eventId: string;
    mediaUrl: string;
    publicId: string;
    mediaType: "photo" | "video";
    isHighlight: boolean;
    likesCount: number;
    likedBy: string[];
    label?: string | null;
    createdAt: string;
    uploaderId?: {
        _id: string;
        userName: string;
    };
    guestId?: {
        _id: string;
        userName: string;
    };
}
