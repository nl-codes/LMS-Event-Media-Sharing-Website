import { User } from "../models/userModel.js";
import {
    createProfile,
    getProfile,
    updateProfile,
} from "../services/profileService.js";

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

export const retrieveProfile = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");

        const profile = await getProfile(user._id);
        res.status(200).json({ profile });
    } catch (err) {
        console.error("❌ Error retrieving profile: ", err);
        const status = err.message === "Profile not found" ? 404 : 400;
        res.status(status).json({ error: err.message });
    }
};

export const editProfile = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");

        const newImageUrl = req.file ? req.file.path : null;

        const updatedProfile = await updateProfile(
            user._id,
            req.body,
            newImageUrl,
        );
        res.status(200).json({
            message: "Profile updated successfully",
            profile: updatedProfile,
        });
    } catch (err) {
        console.error("❌ Error updating profile: ", err);
        const status = err.message === "Profile not found" ? 404 : 400;
        res.status(status).json({ error: err.message });
    }
};
