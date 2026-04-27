import mongoose from "mongoose";

const EventMembershipSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        joinedAt: {
            type: Date,
            default: Date.now,
        },

        lastSeenChatAt: {
            type: Date,
            default: null,
        },
        lastAccessedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

EventMembershipSchema.index({ eventId: 1, userId: 1 }, { unique: true });

export const EventMembership = mongoose.model(
    "EventMembership",
    EventMembershipSchema,
);
