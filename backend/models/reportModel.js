import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Report
 * ------
 * Moderation ticket filed by a User against a piece of content or another
 * User. Reviewed by admins via the admin panel; a Notification is emitted
 * on each verdict so the reporter and target are kept informed.
 *
 * Polymorphic target:
 *  - `targetType` is a string discriminator and `targetId` uses `refPath`
 *    to populate the correct collection. Supported targets:
 *      "Media"        → Media doc
 *      "Interaction"  → Interaction doc (typically a comment)
 *      "User"         → User doc
 *  - The `(targetType, targetId)` compound index makes "how many reports
 *    exist against X?" cheap.
 *
 * Workflow / status:
 *  - "pending"     :   fresh report awaiting admin triage.
 *  - "verified"    :   admin agreed; `adminAction` describes the consequence.
 *  - "dismissed"   :   admin rejected the report.
 *
 * Admin verdict fields (set only on verified/dismissed):
 *  - `verifiedBy`          :    User ref to the admin who acted (regardless of
 *                                  verdict; name is historical).
 *  - `adminReasoning`      :    friendly readable rationale shown to the target.
 *  - `adminAction`         :    the consequence applied:
 *      "none"              :    verdict made but no enforcement.
 *      "hideMedia"         :    sets Media.isHidden = true.
 *      "deleteComment"     :    removes the Interaction.
 *      "suspendUser"       :    flips User.status to "suspended" and bumps
 *                        `         suspensionCount`.
 *
 * Reporter integrity: `reporterId` is server-derived from the auth context,
 * never from the request body.
 */
const reportSchema = new Schema(
    {
        // Always set from req.user; never from client input.
        reporterId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Polymorphic target: populates from the collection named in `targetType`.
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
        // Admin who issued the verdict (any verdict, not just "verified").
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

// Admin queue: newest-first within a status bucket.
reportSchema.index({ status: 1, createdAt: -1 });
// "How many reports against X?" lookups.
reportSchema.index({ targetType: 1, targetId: 1 });

const Report = mongoose.model("Report", reportSchema);
export default Report;
