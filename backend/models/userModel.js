import { model, Schema } from "mongoose";

const userSchema = new Schema({
    userName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    password: { type: String, required: true, trim: true },
});

export const User = model("User", userSchema);
