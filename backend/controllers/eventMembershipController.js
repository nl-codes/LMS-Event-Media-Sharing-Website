/**
 * @module controllers/eventMembershipController
 * @description Registered-user event participation: join (upsert) and
 * "my joined events" listing. Guest participation lives on
 * {@link module:controllers/eventController}.joinAsGuest.
 */

import {
    getUserMemberships,
    joinEvent,
} from "../services/eventMembershipService.js";

/**
 * POST /event-memberships
 *
 * Upsert the caller's membership in an event (idempotent — re-joining is
 * a no-op `lastAccessedAt` refresh).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const joinEventController = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;
        const { eventId } = req.body;

        if (!userId || !eventId) {
            return res.status(400).json({
                success: false,
                message: "userId and eventId are required",
            });
        }

        const membership = await joinEvent(eventId, userId);

        return res.status(200).json({
            success: true,
            message: "Joined event successfully",
            data: membership,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * GET /event-memberships/me
 *
 * "My joined events" feed. Filters out memberships whose populated event
 * is missing (the parent event was deleted).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getMyJoinedEvents = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const memberships = await getUserMemberships(userId);
        // membership.eventId may be null if the parent event was deleted —
        // drop those rows so the frontend doesn't render empty cards.
        const joinedEvents = memberships
            .map((membership) => membership.eventId)
            .filter(Boolean);

        return res.status(200).json({
            success: true,
            total: joinedEvents.length,
            data: joinedEvents,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};
