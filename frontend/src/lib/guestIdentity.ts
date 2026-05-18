export type ScopedGuestCookie = {
    guestId: string;
    userName: string;
    eventId: string;
};

/**
 * Read the per-event scoped guest cookie set during the public join flow.
 * Returns null when the cookie is absent, malformed, or running on the server.
 */
export function getScopedGuestCookie(
    eventSlug: string,
): ScopedGuestCookie | null {
    if (typeof document === "undefined" || !eventSlug) return null;

    const cookieKey = `guest_${eventSlug}`;
    const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${cookieKey}=`))
        ?.split("=")[1];

    if (!cookieValue) return null;

    try {
        const parsed = JSON.parse(decodeURIComponent(cookieValue));
        if (
            parsed &&
            typeof parsed.guestId === "string" &&
            typeof parsed.userName === "string" &&
            typeof parsed.eventId === "string"
        ) {
            return parsed as ScopedGuestCookie;
        }
    } catch {
        return null;
    }

    return null;
}

/**
 * Convenience wrapper that returns just the guest userName for a given slug,
 * or null when no scoped guest cookie is present.
 */
export function getScopedGuestUserName(eventSlug: string): string | null {
    return getScopedGuestCookie(eventSlug)?.userName ?? null;
}
