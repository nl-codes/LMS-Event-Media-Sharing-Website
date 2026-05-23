import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Interaction
 * -----------
 * Polymorphic record for the two engagement types we support against a piece
 * of Media:
 *  - "comment" :   `content` is required.
 *  - "like"    :   `content` is ignored; uniqueness is enforced (see below).
 *
 * Relationships:
 *  - author → User (only registered users can interact; guests cannot).
 *  - media  → Media (the target). Cascade deletes on Media removal happen
 *    explicitly in mediaService / retention processor.
 *
 * Indexes:
 *  - `{ media, createdAt:-1 }` :   newest-first feed of comments per media.
 *  - `{ media, type }`         :   fast counts by type for a media item.
 *
 *  - Partial UNIQUE on `{ author, media, type }` filtered to `type: "like"` to
 *    enforce "one like per user per media" at the DB layer while leaving
 *    comments free to repeat. Crucial: comments must NOT be covered by the
 *    unique constraint, which is why `partialFilterExpression` is required.
 */
const InteractionSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["comment", "like"],
            required: true,
        },
        content: {
            type: String,
            required: function () {
                return this.type === "comment";
            },
            trim: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        media: {
            type: Schema.Types.ObjectId,
            ref: "Media",
            required: true,
        },
    },
    { timestamps: true },
);

// Comment feed per media.
InteractionSchema.index({ media: 1, createdAt: -1 });
// Type-segmented counts/lookups per media.
InteractionSchema.index({ media: 1, type: 1 });
// One like per (author, media). Partial filter keeps comments unaffected.
InteractionSchema.index(
    { author: 1, media: 1, type: 1 },
    {
        unique: true,
        partialFilterExpression: { type: "like" },
    },
);

const Interaction = mongoose.model("Interaction", InteractionSchema);
export default Interaction;
