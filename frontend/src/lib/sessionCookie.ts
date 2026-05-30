const SESSION_COOKIE_NAME = "token";
const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

export function getFrontendSessionToken() {
    if (typeof document === "undefined") return undefined;

    const tokenCookie = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));

    if (!tokenCookie) return undefined;

    return decodeURIComponent(tokenCookie.split("=").slice(1).join("="));
}

export function getSessionAuthHeader(): Record<string, string> {
    const token = getFrontendSessionToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function syncFrontendSessionCookie(token?: string) {
    if (!token || typeof document === "undefined") return;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(
        token,
    )}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function clearFrontendSessionCookie() {
    if (typeof document === "undefined") return;

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
