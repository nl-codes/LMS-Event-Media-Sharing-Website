/**
 * @module controllers/profileController
 * @description HTTP layer for Profile CRUD plus the public profile view
 * used by the "view another user" route. Auth-required handlers all
 * resolve the caller's User by email from the JWT before delegating to
 * {@link module:services/profileService}.
 */

import { User } from "../models/userModel.js";
import {
    createProfile,
    getProfile,
    updateProfile,
    deleteProfile,
    getPublicProfile,
} from "../services/profileService.js";

/**
 * POST /users/profile
 *
 * Create the caller's Profile (1:1 with their User). A new thumbnail
 * arrives via multer at `req.file`.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const addProfile = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");
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

/**
 * GET /users/profile
 *
 * The caller's own Profile.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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

/**
 * PATCH /users/profile
 *
 * Patch profile fields; on a new image the service destroys the previous
 * Cloudinary asset.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
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

/**
 * GET /users/profile/:userId/public
 *
 * Public profile view: name, bio, avatar, created+joined events. Suspended
 * users 404 from the service.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const retrievePublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const data = await getPublicProfile(userId);
        res.status(200).json({ success: true, data });
    } catch (err) {
        const status = err.message === "User not found" ? 404 : 400;
        res.status(status).json({ success: false, error: err.message });
    }
};

/**
 * DELETE /users/profile
 *
 * Delete the caller's Profile. Service also destroys the Cloudinary
 * avatar asset.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const removeProfile = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email });
        if (!user) throw new Error("User not found");

        await deleteProfile(user._id);
        res.status(200).json({ message: "Profile deleted successfully" });
    } catch (err) {
        console.error("❌ Error deleting profile: ", err);
        const status = err.message === "Profile not found" ? 404 : 400;
        res.status(status).json({ error: err.message });
    }
};
