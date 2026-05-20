import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import { attachAvatars } from "../utils/attachAvatars.js";

export const joinEvent = async (eventId, userId) => {
    if (!eventId || !userId) {
        throw new Error("eventId and userId are required");
    }

    return await EventMembership.findOneAndUpdate(
        { eventId, userId },
        {
            $set: {
                lastAccessedAt: new Date(),
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        },
    );
};

export const getUserMemberships = async (userId) => {
    if (!userId) {
        throw new Error("userId is required");
    }

    const memberships = await EventMembership.find({ userId })
        .populate({
            path: "eventId",
            select: "eventName startTime uniqueSlug location description thumbnail hostId tier",
            populate: { path: "hostId", select: "userName email" },
        })
        .sort({ lastAccessedAt: -1 });

    return attachAvatars(memberships, ["eventId.hostId"]);
};

/**
 * Mark chat as read for a user in an event by updating lastSeenChatAt
 */
export const markChatAsRead = async (eventId, userId, time = new Date()) => {
    if (!eventId || !userId) {
        throw new Error("eventId and userId are required");
    }

    return await EventMembership.findOneAndUpdate(
        { eventId, userId },
        {
            $set: {
                lastSeenChatAt: time,
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        },
    );
};

export const getEventParticipationCount = async (eventId) => {
    if (!eventId) {
        throw new Error("eventId is required");
    }

    const [totalGuest, totalUsers] = await Promise.all([
        Guest.countDocuments({ eventId }),
        EventMembership.countDocuments({ eventId }),
    ]);

    return totalGuest + totalUsers;
};
