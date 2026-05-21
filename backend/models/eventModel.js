import mongoose from "mongoose";
import crypto from "crypto";
import {
    getMediaRetentionDeleteAt,
    getMediaRetentionWarningStartsAt,
} from "../utils/mediaRetention.js";

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
        tier: {
            type: String,
            enum: ["free", "premium", "pro"],
            default: "free",
        },
        expiresAt: {
            type: Date,
            default: null,
        },
        uploadLimit: {
            type: Number,
            default: 100,
        },
        thumbnail: {
            type: String,
            default: "",
        },

        participantCount: {
            type: Number,
            default: 0,
        },
        privacy: {
            type: String,
            enum: ["public", "private"],
            default: "private",
        },
        highlightsGeneratedAt: {
            type: Date,
            default: null,
        },
        highlightGenerationStatus: {
            type: String,
            enum: ["pending", "processing", "completed", "failed"],
            default: "pending",
        },

        mediaDeletionStatus: {
            type: String,
            enum: ["active", "queued", "processing", "completed", "failed"],
            default: "active",
            index: true,
        },
        mediaDeletedAt: {
            type: Date,
            default: null,
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

/**
 * VIRTUAL: Computed deletion deadline for this event's media. Derived from
 * tier + endTime so changing either flows through without a migration.
 */
EventSchema.virtual("mediaRetentionDeleteAt").get(function () {
    return getMediaRetentionDeleteAt(this);
});

/**
 * VIRTUAL: When the host-facing deletion-warning UI should start showing.
 */
EventSchema.virtual("mediaRetentionWarningStartsAt").get(function () {
    return getMediaRetentionWarningStartsAt(this);
});

export const Event = mongoose.model("Event", EventSchema);
