import jwt from "jsonwebtoken";
import { Guest } from "../models/guestModel.js";

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

    const guestCookieId = req.cookies?.guest_id;
    if (!guestCookieId) {
        return next();
    }

    try {
        const guest = await Guest.findOne({ guest_id: guestCookieId });
        if (guest) {
            req.guest = guest;
        }
    } catch {
        // No-op. Request continues as anonymous if guest lookup fails.
    }

    return next();
};
