export type User = {
    _id: string;
    userName: string;
    email: string;
    role: "user" | "admin" | "superadmin" | "guest";
    status?: "pending" | "active" | "suspended";
    adminRequestStatus?: "none" | "pending" | "approved" | "suspended";
};

export type UserContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    isInitialized: boolean;
};

export interface userJWTToken {
    id: string;
    email: string;
    userName: string;
    role: "user" | "admin" | "superadmin" | "guest";
    iat: number;
    exp: number;
}
