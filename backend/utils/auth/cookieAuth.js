/**
 * @module utils/auth/cookieAuth
 * @description Single source of truth for the auth-cookie attributes.
 * Mirror these in `logoutUser` when clearing the cookie or the browser
 * won't drop it.
 */

/**
 * Shared auth-cookie attributes. Production uses a parent-domain cookie so
 * www.lms.narayanlohani.com.np and api.lms.narayanlohani.com.np share the
 * same first-party session without exposing the JWT to client JavaScript.
 */
export const getAuthCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path: "/",
        ...(isProduction
            ? {
                  domain:
                      process.env.COOKIE_DOMAIN || ".narayanlohani.com.np",
              }
            : {}),
    };
};

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
