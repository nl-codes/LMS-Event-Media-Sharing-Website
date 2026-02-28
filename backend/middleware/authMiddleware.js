import jwt from "jsonwebtoken";

/**
 * Middleware that verifies the JWT token from the httpOnly cookie.
 * Attaches the decoded user payload to `req.user` on success.
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
 * Middleware that restricts access to specific roles.
 * Must be used after `requireAuth`.
 *
 * @param  {...string} roles - Allowed roles (e.g. "admin", "user")
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access denied" });
        }
        next();
    };
};
