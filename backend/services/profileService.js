import { User } from "../models/userModel.js";
import { Profile } from "../models/profileModel.js";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { extractPublicIdFromUrl } from "../utils/helperFunctions.js";

export const createProfile = async (userId, profileData) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const existingProfile = await Profile.findOne({ user: userId });
    if (existingProfile)
        throw new Error("Profile already exists for this user");

    const { firstName, lastName, bio, profilePicture, gender, country } = profileData;

    const newProfile = new Profile({
        user: userId,
        firstName,
        lastName,
        bio,
        profilePicture: profilePicture || "",
        gender: gender || "",
        country: country || "",
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

    const { firstName, lastName, bio, gender, country } = updateData;

    if (firstName !== undefined) profile.firstName = firstName;
    if (lastName !== undefined) profile.lastName = lastName;
    if (bio !== undefined) profile.bio = bio;
    if (gender !== undefined) profile.gender = gender;
    if (country !== undefined) profile.country = country;

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

export const getPublicProfile = async (userId) => {
    const user = await User.findById(userId).select("userName createdAt status");
    if (!user || user.status === "suspended") throw new Error("User not found");

    const profile = await Profile.findOne({ user: userId }).select(
        "firstName lastName bio profilePicture gender country",
    );

    const [createdEvents, memberships] = await Promise.all([
        Event.find({ hostId: userId })
            .select("eventName description location startTime endTime thumbnail uniqueSlug status isPremium")
            .sort({ createdAt: -1 })
            .limit(20),
        EventMembership.find({ userId })
            .populate(
                "eventId",
                "eventName description location startTime endTime thumbnail uniqueSlug status isPremium hostId",
            )
            .sort({ joinedAt: -1 })
            .limit(20),
    ]);

    const joinedEvents = memberships
        .map((m) => m.eventId)
        .filter(Boolean)
        .filter((e) => String(e.hostId) !== String(userId));

    return { user, profile, createdEvents, joinedEvents };
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
