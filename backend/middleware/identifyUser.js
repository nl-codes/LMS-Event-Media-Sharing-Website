/**
 * @module middleware/identifyUser
 * @description Optional-auth middleware: attaches `req.user` if a valid
 * JWT cookie is present, else falls back to the per-event scoped guest
 * cookie (`guest_<slug>`) and attaches `req.guest`. Never 401s a
 * fully anonymous request just flows through with neither populated.
 * Used by routes that must serve both registered users and guests.
 */

import jwt from "jsonwebtoken";
import { Guest } from "../models/guestModel.js";

/**
 * Best-effort lookup of the event slug from common request shapes
 * (header, route param, query string, or `/events/<slug>` in the URL).
 * @param {import("express").Request} req
 * @returns {string} The slug, or "" if no source matched.
 */
const extractSlug = (req) => {
    const fromHeader = req.headers?.["x-event-slug"];
    if (typeof fromHeader === "string" && fromHeader.trim()) {
        return fromHeader.trim();
    }

    if (typeof req.params?.slug === "string" && req.params.slug.trim()) {
        return req.params.slug.trim();
    }

    if (typeof req.query?.slug === "string" && req.query.slug.trim()) {
        return req.query.slug.trim();
    }

    const eventSlugMatch = req.originalUrl?.match(/\/events\/([^/?#]+)/);
    if (eventSlugMatch?.[1]) {
        return eventSlugMatch[1];
    }

    return "";
};

/**
 * Optional-auth middleware. Populates `req.user` for a valid JWT cookie,
 * else `req.guest` for a matching event-scoped guest cookie. Never 401s.
 * @param {import("express").Request} req
 * @param {import("express").Response} _res
 * @param {import("express").NextFunction} next
 */
export const identifyUser = async (req, _res, next) => {
    const token = req.cookies?.token;

    if (token) {
        try {
            const secret = process.env.JWT_SECRET_KEY;
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            return next();
        } catch {
            // Invalid/expired token silently fall through to the guest path
            // so anonymous flows still work.
        }
    }

    // No valid JWT look for a per-event scoped guest cookie.
    const slug = extractSlug(req);
    if (!slug) {
        return next();
    }

    const scopedGuestCookie = req.cookies?.[`guest_${slug}`];
    if (!scopedGuestCookie) {
        return next();
    }

    try {
        const parsedCookie =
            typeof scopedGuestCookie === "string"
                ? JSON.parse(scopedGuestCookie)
                : scopedGuestCookie;

        const guestId = parsedCookie?.guestId;
        if (!guestId) {
            return next();
        }

        const guest = await Guest.findOne({ guest_id: guestId });
        if (guest) {
            req.guest = guest;
        }
    } catch {
        // No-op. Request continues as anonymous if guest lookup fails.
    }

    return next();
};
