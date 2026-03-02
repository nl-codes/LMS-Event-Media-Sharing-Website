import { model, Schema } from "mongoose";

const profileSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        firstName: { type: String, trim: true, default: "" },
        lastName: { type: String, trim: true, default: "" },
        bio: { type: String, trim: true, default: "" },
        profilePicture: { type: String, default: "" },
    },
    { timestamps: true },
);

export const Profile = model("Profile", profileSchema);
