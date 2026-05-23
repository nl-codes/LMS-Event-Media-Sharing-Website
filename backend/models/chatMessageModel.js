import mongoose from "mongoose";

/**
 * ChatMessage
 * -----------
 * One line of text in an Event's chat room. Authored exclusively by
 * registered Users (the socket handler in server.js rejects guest sends)
 *
 * Relationships:
 *  - eventId  → Event (the chat room).
 *  - senderId → User.
 *
 * `senderName` and `senderEmail` are snapshotted at send time so historical
 * messages keep showing the original author even if the User later updates
 * their profile or is removed. Don't trust them for permission checks, use `senderId`.
 *
 * The `(eventId, createdAt:-1)` compound index supports the chat-history
 * fetch: "messages for room X, newest first".
 */
const ChatMessageSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
        },
        // Snapshotted at send time
        senderName: {
            type: String,
            required: true,
        },
        senderEmail: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    },
);

// Chat-history query: per-event, newest first.
ChatMessageSchema.index({ eventId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
