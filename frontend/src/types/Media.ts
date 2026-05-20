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
    /** Calculated by the API from like interactions. */
    likesCount: number;
    /** Compatibility field calculated by the API from like interactions. */
    likedBy: string[];
    label?: string | null;
    isPublic: boolean;
    createdAt: string;
    uploaderId?: {
        _id: string;
        userName: string;
        profilePicture?: string;
    };
    guestId?: {
        _id: string;
        userName: string;
    };
}

export type FlaggedMedia = {
    _id: string;
    mediaUrl: string;
    mediaType: string;
    label?: string;
    hiddenReason?: string;
    createdAt: string;
};
