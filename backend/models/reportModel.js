import mongoose from "mongoose";

const { Schema } = mongoose;

const reportSchema = new Schema(
    {
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        targetId: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: "targetType",
            index: true,
        },
        targetType: {
            type: String,
            required: true,
            enum: ["Media", "Interaction", "User"],
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "verified", "dismissed"],
            default: "pending",
            index: true,
        },
        verifiedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        adminReasoning: {
            type: String,
            default: "",
            trim: true,
        },
        adminAction: {
            type: String,
            enum: ["none", "hideMedia", "deleteComment", "suspendUser"],
            default: "none",
        },
    },
    { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetType: 1, targetId: 1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
