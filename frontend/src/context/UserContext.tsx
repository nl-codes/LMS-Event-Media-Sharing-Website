"use client";

import { User, UserContextType } from "@/types/User";
import { backend_url } from "@/config/backend";
import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
    useCallback,
} from "react";
import { getFrontendSessionToken } from "@/lib/sessionCookie";

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const fetchUser = useCallback(async () => {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 12000);
        const token = getFrontendSessionToken();

        try {
            const res = await fetch(`${backend_url}/users/me`, {
                credentials: "include",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                signal: controller.signal,
            });
            if (res.ok) {
                const data: User = await res.json();
                setUser(data);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            window.clearTimeout(timeoutId);
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <UserContext.Provider value={{ user, setUser, isInitialized }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};
