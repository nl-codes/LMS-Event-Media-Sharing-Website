import {
    getUserGrowth,
    getEventGrowth,
    getMediaGrowth,
    getEventInsights,
} from "../services/analyticsService.js";
import { Event } from "../models/eventModel.js";

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

export const getUserGrowthController = makeHandler(getUserGrowth);
export const getEventGrowthController = makeHandler(getEventGrowth);
export const getMediaGrowthController = makeHandler(getMediaGrowth);

// Host-scoped per-event insights. Caller must be the host of the event (or an
// admin / superadmin) to read these numbers.
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
