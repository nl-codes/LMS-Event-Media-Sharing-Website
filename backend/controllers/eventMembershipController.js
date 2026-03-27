import {
    getUserMemberships,
    joinEvent,
} from "../services/eventMembershipService.js";

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
