"use client";

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import { useUser } from "@/context/UserContext";

type Identity = {
    guestId: string | null;
    userName: string | null;
};

type IdentityContextType = {
    identity: Identity;
    displayName: string;
    setGuestIdentity: (payload: { guestId: string; userName: string }) => void;
    clearGuestIdentity: () => void;
};

const IdentityContext = createContext<IdentityContextType | undefined>(
    undefined,
);

const STORAGE_KEY = "lms_guest_identity";

export const IdentityProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const [identity, setIdentity] = useState<Identity>(() => {
        if (typeof window === "undefined") {
            return { guestId: null, userName: null };
        }

        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                return { guestId: null, userName: null };
            }

            const parsed = JSON.parse(stored) as Identity;
            return {
                guestId: parsed.guestId || null,
                userName: parsed.userName || null,
            };
        } catch {
            return { guestId: null, userName: null };
        }
    });

    useEffect(() => {
        if (identity.guestId || identity.userName) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, [identity]);

    const setGuestIdentity = ({
        guestId,
        userName,
    }: {
        guestId: string;
        userName: string;
    }) => {
        setIdentity({ guestId, userName });
    };

    const clearGuestIdentity = () => {
        setIdentity({ guestId: null, userName: null });
    };

    const displayName = useMemo(() => {
        if (user?.userName) return user.userName;
        if (identity.userName) return identity.userName;
        return "Guest";
    }, [identity.userName, user?.userName]);

    return (
        <IdentityContext.Provider
            value={{
                identity,
                displayName,
                setGuestIdentity,
                clearGuestIdentity,
            }}>
            {children}
        </IdentityContext.Provider>
    );
};

export const useIdentity = () => {
    const ctx = useContext(IdentityContext);
    if (!ctx) {
        throw new Error("useIdentity must be used within an IdentityProvider");
    }
    return ctx;
};
