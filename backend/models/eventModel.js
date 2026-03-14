import mongoose from "mongoose";
import crypto from "crypto";

const EventSchema = new mongoose.Schema(
    {
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        eventName: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            required: true,
        },

        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },

        uniqueSlug: {
            type: String,
            unique: true,
            index: true,
        },

        status: {
            type: String,
            enum: ["Active", "Completed", "Cancelled"],
            default: "Active",
        },
        isPremium: {
            type: Boolean,
            default: false,
        },

        participantCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        id: false,
    },
);

/**
 * MIDDLEWARE: Generate unique slug before saving
 */
EventSchema.pre("save", function (next) {
    if (!this.uniqueSlug) {
        this.uniqueSlug = crypto.randomBytes(4).toString("hex");
    }
    next();
});

/**
 * VIRTUAL: Check if event is currently "Live"
 */
EventSchema.virtual("isLive").get(function () {
    const now = new Date();
    return (
        this.status === "Active" && now >= this.startTime && now <= this.endTime
    );
});

/**
 * VIRTUAL: Check if event is in the "Wait" period (Before Start)
 */
EventSchema.virtual("isUpcoming").get(function () {
    return new Date() < this.startTime;
});

export const Event = mongoose.model("Event", EventSchema);
