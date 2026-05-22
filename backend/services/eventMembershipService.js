import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import { attachAvatars } from "../utils/attachAvatars.js";

/**
 * @module services/eventMembershipService
 * @description Registered-user event participation. Upsert-shaped — re-
 * joining a known event is a no-op `lastAccessedAt` refresh.
 */

/**
 * Upsert a membership row and bump `lastAccessedAt`.
 * @param {string} eventId
 * @param {string} userId
 * @returns {Promise<import("mongoose").Document>}
 * @throws {Error} If either id is missing.
 */
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

/**
 * List a user's memberships with the joined event + its host (avatars
 * attached), sorted by most recent access.
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export const getUserMemberships = async (userId) => {
    if (!userId) {
        throw new Error("userId is required");
    }

    const memberships = await EventMembership.find({ userId })
        .populate({
            path: "eventId",
            select: "eventName startTime endTime uniqueSlug location description thumbnail hostId tier",
            populate: { path: "hostId", select: "userName email" },
        })
        .sort({ lastAccessedAt: -1 });

    return attachAvatars(memberships, ["eventId.hostId"]);
};

/**
 * Update `lastSeenChatAt` for a user in an event. Upserts the membership
 * row if missing.
 * @param {string} eventId
 * @param {string} userId
 * @param {Date} [time=new Date()]
 * @returns {Promise<import("mongoose").Document>}
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

/**
 * Total participants = registered members + guests.
 * @param {string} eventId
 * @returns {Promise<number>}
 */
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
