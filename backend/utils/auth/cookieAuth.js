/**
 * @module utils/auth/cookieAuth
 * @description Single source of truth for the auth-cookie attributes.
 * Mirror these in `logoutUser` when clearing the cookie or the browser
 * won't drop it.
 */

/**
 * Set the httpOnly auth cookie. `secure` is only enabled in production
 * so local HTTP development still works.
 * @param {import("express").Response} res
 * @param {string} token JWT to persist on the client.
 */
export const setAuthCookie = (res, token) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 1 * 24 * 60 * 60 * 1000,
        path: "/",
    });
};
