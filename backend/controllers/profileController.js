import { User } from "../models/userModel.js";
import { createProfile } from "../services/profileService.js";

export const addProfile = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");
        console.log(req.body);
        const profilePicture = req.file ? req.file.path : "";
        const profile = await createProfile(user._id, {
            ...req.body,
            profilePicture,
        });

        res.status(201).json({
            message: "Profile created successfully",
            profile,
        });
    } catch (err) {
        console.error("❌ Error creating profile: ", err);
        const status =
            err.message === "Profile already exists for this user" ? 409 : 400;
        res.status(status).json({ error: err.message });
    }
};
