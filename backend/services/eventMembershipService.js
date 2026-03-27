import { EventMembership } from "../models/eventMembershipModel.js";

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
