import { User } from "../models/userModel.js";
import { Profile } from "../models/profileModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { extractPublicIdFromUrl } from "../utils/helperFunctions.js";

export const createProfile = async (userId, profileData) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const existingProfile = await Profile.findOne({ user: userId });
    if (existingProfile)
        throw new Error("Profile already exists for this user");

    const { firstName, lastName, bio, profilePicture } = profileData;

    const newProfile = new Profile({
        user: userId,
        firstName,
        lastName,
        bio,
        profilePicture: profilePicture || "",
    });

    return await newProfile.save();
};

export const getProfile = async (userId) => {
    const profile = await Profile.findOne({ user: userId }).populate(
        "user",
        "userName email",
    );
    if (!profile) throw new Error("Profile not found");
    return profile;
};

export const updateProfile = async (userId, updateData, newImageUrl) => {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) throw new Error("Profile not found");

    const { firstName, lastName, bio } = updateData;

    if (firstName !== undefined) profile.firstName = firstName;
    if (lastName !== undefined) profile.lastName = lastName;
    if (bio !== undefined) profile.bio = bio;

    if (newImageUrl) {
        if (profile.profilePicture) {
            const publicId = extractPublicIdFromUrl(profile.profilePicture);

            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
            }
        }
        profile.profilePicture = newImageUrl;
    }

    return await profile.save();
};

export const deleteProfile = async (userId) => {
    const profile = await Profile.findOne({ user: userId });
    if (!profile) throw new Error("Profile not found");

    // Delete profile picture from Cloudinary if it exists
    if (profile.profilePicture) {
        const publicId = extractPublicIdFromUrl(profile.profilePicture);

        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
        }
    }
    await Profile.findOneAndDelete({ user: userId });
};
