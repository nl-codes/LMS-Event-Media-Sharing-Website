import mongoose from "mongoose";

const { Schema } = mongoose;

const notificationSchema = new Schema(
    {
        recipientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: [
                "report_filed",
                "report_verified",
                "report_dismissed",
                "media_hidden",
                "comment_deleted",
                "user_suspended",
                "system",
            ],
            default: "system",
        },
        link: {
            type: String,
            default: "",
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    { timestamps: true },
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
