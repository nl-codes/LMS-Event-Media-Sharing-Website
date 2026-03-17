import mongoose from "mongoose";

const { Schema } = mongoose;

const mediaSchema = new Schema({
    eventId: {
        type: Schema.Types.ObjectId,
        ref: "Event",
        required: true,
    },
    uploaderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    guestId: {
        type: String,
        default: null,
    },
    mediaUrl: {
        type: String,
        required: true,
    },
    publicId: {
        type: String,
        required: true,
    },
    mediaType: {
        type: String,
        enum: ["photo", "video"],
        required: true,
    },
    isHighlight: {
        type: Boolean,
        default: false,
    },
    likesCount: {
        type: Number,
        default: 0,
    },
    likedBy: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    label: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Media = mongoose.model("Media", mediaSchema);
export default Media;
