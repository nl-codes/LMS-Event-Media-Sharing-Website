import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Appeal
 * ------
 * Petition a suspended User files to request reinstatement. Lives outside
 * the normal Report flow because the suspended user cannot log in, so the
 * appeal is submitted through a dedicated unauthenticated endpoint guarded
 * by the user's email.
 *
 *  Relationships:
 *  - userId     → User (the suspended account or event host).
 *  - eventId    → Event (only for event suspension appeals).
 *  - reviewedBy → User (the admin who issued the verdict; null while pending).
 *  - `email` is snapshotted at submission time so admins can see what the
 *    suspended user typed.
 *
 *  Workflow:
 *  - "pending"  : fresh appeal in the admin queue.
 *  - "approved" : admin reinstates the user;
 *                 the appeal service flips User.status back to "active".
 *  - "rejected" : User stays suspended; `adminNote` carries the rationale.
 */
const appealSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        appealType: {
            type: String,
            enum: ["user", "event"],
            default: "user",
            index: true,
        },
        eventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
            default: null,
            required() {
                return this.appealType === "event";
            },
        },
        // Snapshot of the email at submission
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

// Admin queue: newest-first within a status bucket.
appealSchema.index({ status: 1, createdAt: -1 });
appealSchema.index({ appealType: 1, status: 1, createdAt: -1 });

const Appeal = mongoose.model("Appeal", appealSchema);
export default Appeal;
