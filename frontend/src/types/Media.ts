export interface Media {
    _id: string;
    eventId:
        | string
        | {
              _id: string;
              eventName: string;
              uniqueSlug?: string;
          };
    mediaUrl: string;
    publicId: string;
    mediaType: "photo" | "video" | "image";
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
