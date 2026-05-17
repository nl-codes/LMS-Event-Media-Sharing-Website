import mongoose from "mongoose";

const { Schema } = mongoose;

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

InteractionSchema.index({ media: 1, createdAt: -1 });
InteractionSchema.index({ media: 1, type: 1 });
InteractionSchema.index(
    { author: 1, media: 1, type: 1 },
    {
        unique: true,
        partialFilterExpression: { type: "like" },
    },
);

const Interaction = mongoose.model("Interaction", InteractionSchema);
export default Interaction;
