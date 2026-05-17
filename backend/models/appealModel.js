import mongoose from "mongoose";

const { Schema } = mongoose;

const appealSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        appealMessage: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
            index: true,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        adminNote: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { timestamps: true },
);

appealSchema.index({ status: 1, createdAt: -1 });

const Appeal = mongoose.model("Appeal", appealSchema);
export default Appeal;
