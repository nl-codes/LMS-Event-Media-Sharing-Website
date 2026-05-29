/**
 * @module utils/auth/cookieAuth
 * @description Single source of truth for the auth-cookie attributes.
 * Mirror these in `logoutUser` when clearing the cookie or the browser
 * won't drop it.
 */

/**
 * Shared auth-cookie attributes. Production uses `SameSite=None` so the
 * Vercel frontend can send the Render API cookie on cross-site requests.
 */
export const getAuthCookieOptions = () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
});

/**
 * Set the httpOnly auth cookie. `secure` is only enabled in production
 * so local HTTP development still works.
 * @param {import("express").Response} res
 * @param {string} token JWT to persist on the client.
 */
export const setAuthCookie = (res, token) => {
    res.cookie("token", token, {
        ...getAuthCookieOptions(),
        maxAge: 1 * 24 * 60 * 60 * 1000,
    });
};
