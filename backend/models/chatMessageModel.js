import mongoose from "mongoose";

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

// Compound index for efficient queries by event and time
ChatMessageSchema.index({ eventId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model("ChatMessage", ChatMessageSchema);
