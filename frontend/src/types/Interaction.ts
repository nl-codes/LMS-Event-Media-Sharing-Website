export interface InteractionAuthor {
    _id: string;
    userName: string;
}

export interface Interaction {
    _id: string;
    type: "comment";
    content: string;
    author: InteractionAuthor;
    media: string;
    createdAt: string;
    updatedAt: string;
}
