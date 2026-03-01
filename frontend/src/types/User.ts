export type User = {
    userName: string;
    email: string;
    role: string;
};

export type UserContextType = {
    user: User | null;
    setUser: (user: User | null) => void;
    isInitialized: boolean;
};

export interface userJWTToken {
    email: string;
    userName: string;
    role: "user" | "admin" | "guest";
    iat: number;
    exp: number;
}
