/**
 * @module middleware/authMiddleware
 * @description JWT cookie-based auth gates. {@link requireAuth} verifies
 * the token and attaches `req.user`; {@link requireRole} layers a role
 * check on top. Optional-auth (guest fallback) lives in
 * {@link module:middleware/identifyUser}.
 */

import jwt from "jsonwebtoken";

/**
 * Verify the JWT from the httpOnly `token` cookie and attach the decoded
 * payload as `req.user`. Rejects the request when no cookie is present
 * or the token is invalid/expired.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const requireAuth = (req, res, next) => {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ error: "Authentication required" });
    }

    try {
        const secret = process.env.JWT_SECRET_KEY;
        const decoded = jwt.verify(token, secret);
        req.user = decoded; // { email, userName, role, iat, exp }
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

/**
 * Restrict access to specific roles. Must be chained AFTER
 * {@link requireAuth} so `req.user` is populated.
 * @param {...string} roles Allowed role values, e.g. `"admin"`, `"superadmin"`.
 * @returns {import("express").RequestHandler}
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }
        next();
    };
};
