import { User } from "../models/userModel.js";
import { Profile } from "../models/profileModel.js";

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
