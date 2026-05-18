export interface InteractionAuthor {
    _id: string;
    userName: string;
    profilePicture?: string;
}

export interface Interaction {
    _id: string;
    type: "comment" | "like";
    content?: string;
    author: InteractionAuthor;
    media: string;
    createdAt: string;
    updatedAt: string;
}
