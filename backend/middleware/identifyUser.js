import jwt from "jsonwebtoken";
import { Guest } from "../models/guestModel.js";

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

export const identifyUser = async (req, _res, next) => {
    const token = req.cookies?.token;

    if (token) {
        try {
            const secret = process.env.JWT_SECRET_KEY;
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            return next();
        } catch {
            // Ignore invalid token and fall back to guest cookie.
        }
    }

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
