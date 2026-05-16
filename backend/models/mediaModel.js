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
        type: Schema.Types.ObjectId,
        ref: "Guest",
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
        required: true,
        lowercase: true,
        trim: true,
        enum: ["photo", "video", "image"],
        message: "{VALUE} is not a supported media type",
    },
    isHighlight: {
        type: Boolean,
        default: false,
    },
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
