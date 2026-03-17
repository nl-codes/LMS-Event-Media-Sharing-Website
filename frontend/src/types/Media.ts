export interface Media {
    _id: string;
    eventId: string;
    uploaderId?: string | null;
    guestId?: string | null;
    mediaUrl: string;
    publicId: string;
    mediaType: "photo" | "video";
    isHighlight: boolean;
    likesCount: number;
    likedBy: string[];
    label?: string | null;
    createdAt: string;
    uploader?: {
        _id: string;
        name: string;
    };
}
