import mongoose from "mongoose";

const { Schema } = mongoose;

const InteractionSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["comment"],
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

const Interaction = mongoose.model("Interaction", InteractionSchema);
export default Interaction;
