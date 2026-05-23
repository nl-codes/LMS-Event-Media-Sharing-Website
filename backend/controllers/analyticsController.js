/**
 * @module controllers/analyticsController
 * @description Two surfaces: admin-wide growth charts (users / events /
 * media) and per-event host/admin insights with bucketed timeseries.
 */

import {
    getUserGrowth,
    getEventGrowth,
    getMediaGrowth,
    getEventInsights,
} from "../services/analyticsService.js";
import { Event } from "../models/eventModel.js";

/**
 * Express-handler factory for the three platform-growth endpoints. They
 * all share the same `?range=` query + response shape, so we don't
 * repeat the boilerplate three times.
 * @param {(range: string) => Promise<object>} loader Service function.
 * @returns {import("express").RequestHandler}
 */
const makeHandler = (loader) => async (req, res) => {
    try {
        const { range } = req.query;
        const result = await loader(range);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || "Failed to load analytics",
        });
    }
};

/** GET /analytics/users?range=... — platform user growth chart. */
export const getUserGrowthController = makeHandler(getUserGrowth);

/** GET /analytics/events?range=... — platform event growth chart. */
export const getEventGrowthController = makeHandler(getEventGrowth);

/** GET /analytics/media?range=... — platform media growth chart. */
export const getMediaGrowthController = makeHandler(getMediaGrowth);

/**
 * GET /events/:eventId/insights
 *
 * Host- or admin-only per-event insights. The host check is local (not
 * pushed into the service) because we also need to allow admin/superadmin
 * read-through.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getEventInsightsController = async (req, res) => {
    try {
        const { eventId } = req.params;
        const requesterId = req.user?.id;
        const role = req.user?.role;

        if (!requesterId) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required" });
        }

        const event = await Event.findById(eventId).select("hostId");
        if (!event) {
            return res
                .status(404)
                .json({ success: false, message: "Event not found" });
        }

        const isHost = event.hostId.toString() === requesterId;
        const isAdmin = role === "admin" || role === "superadmin";
        if (!isHost && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Only the host can view event insights",
            });
        }

        const result = await getEventInsights(eventId);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        const status = err.status || 500;
        res.status(status).json({
            success: false,
            message: err.message || "Failed to load event insights",
        });
    }
};
