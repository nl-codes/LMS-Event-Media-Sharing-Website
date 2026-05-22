/**
 * @module utils/auth/generateJWTtoken
 * @description Wrapper that signs the session JWT with the shared secret.
 * Throws if `JWT_SECRET_KEY` is missing — fail-fast instead of issuing an
 * unverifiable token.
 */

import jwt from "jsonwebtoken";

/**
 * Sign a 1-day JWT.
 * @param {object} payload Claims to embed (id, email, role, ...).
 * @returns {string}
 * @throws {Error} If `JWT_SECRET_KEY` is not set.
 */
export const generateJWTtoken = (payload) => {
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
        throw new Error("JWT secret key is missing in environment variables");
    }

    return jwt.sign(payload, secret, { expiresIn: "1d" });
};
