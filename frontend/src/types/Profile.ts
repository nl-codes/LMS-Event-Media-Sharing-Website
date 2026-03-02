import { User } from "./User";

export type Profile = {
    firstName: string;
    lastName: string;
    bio: string;
    profilePicture: string;
    user: User | null;
};
