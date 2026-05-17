import { User } from "./User";

export type Profile = {
    firstName: string;
    lastName: string;
    bio: string;
    profilePicture: string;
    gender?: string;
    country?: string;
    user: User | null;
    updatedAt: string;
};
