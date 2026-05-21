import mongoose from "mongoose";

// Holds the event payload a host submitted for a Premium/Pro creation until
// the corresponding Stripe Checkout Session resolves. The event itself is
// only created after Stripe confirms payment, so this collection is the only
// place a "paid event" exists between submit and payment confirmation.
const PendingEventCheckoutSchema = new mongoose.Schema(
    {
        hostId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        // Pre-generated so the thumbnail Cloudinary folder and the eventual
        // Event document share the same id. Cleanup of orphaned thumbnails
        // on cancel can be addressed via the existing event-cleanup queue.
        reservedEventId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        tier: {
            type: String,
            enum: ["premium", "pro"],
            required: true,
        },

        // Snapshot of the validated event payload. We deliberately do not
        // store file buffers here: the thumbnail is uploaded to Cloudinary
        // before checkout and only its URL persists.
        eventData: {
            eventName: { type: String, required: true },
            description: { type: String, default: "" },
            location: { type: String, required: true },
            startTime: { type: Date, required: true },
            privacy: {
                type: String,
                enum: ["public", "private"],
                default: "private",
            },
            thumbnail: { type: String, default: "" },
        },

        status: {
            type: String,
            enum: ["pending", "completed", "cancelled", "expired"],
            default: "pending",
            index: true,
        },

        createdEventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            default: null,
        },

        // Stripe Checkout Sessions expire after 24h by default. Mongo's TTL
        // index will drop abandoned records sometime after that window.
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true },
);

PendingEventCheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PendingEventCheckout = mongoose.model(
    "PendingEventCheckout",
    PendingEventCheckoutSchema,
);
