import { User } from "../models/userModel.js";
import { Profile } from "../models/profileModel.js";
import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { extractPublicIdFromUrl } from "../utils/helperFunctions.js";

/**
 * @module services/profileService
 * @description Profile CRUD + the public-profile view. Replacing a profile
 * picture destroys the previous Cloudinary asset; suspended users 404 on
 * the public view.
 */

/**
 * @typedef {object} ProfileInput
 * @property {string} [firstName]
 * @property {string} [lastName]
 * @property {string} [bio]
 * @property {string} [profilePicture]
 * @property {string} [gender]
 * @property {string} [country]
 */

/**
 * Create a Profile bound to a User. Fails if one already exists (1:1).
 * @param {string} userId
 * @param {ProfileInput} profileData
 * @returns {Promise<import("mongoose").Document>} The saved profile.
 * @throws {Error} If user missing or profile already exists.
 */
export const createProfile = async (userId, profileData) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const existingProfile = await Profile.findOne({ user: userId });
    if (existingProfile)
        throw new Error("Profile already exists for this user");

    const { firstName, lastName, bio, profilePicture, gender, country } =
        profileData;

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

/**
 * Fetch the caller's own Profile with User populated.
 * @param {string} userId
 * @returns {Promise<import("mongoose").Document>}
 * @throws {Error} If no profile exists for the user.
 */
export const getProfile = async (userId) => {
    const profile = await Profile.findOne({ user: userId }).populate(
        "user",
        "userName email",
    );
    if (!profile) throw new Error("Profile not found");
    return profile;
};

/**
 * Patch profile fields; on `newImageUrl`, destroys the previous Cloudinary
 * asset before saving the new URL.
 * @param {string} userId
 * @param {ProfileInput} updateData
 * @param {string} [newImageUrl] New Cloudinary URL for the avatar.
 * @returns {Promise<import("mongoose").Document>} Updated profile.
 * @throws {Error} If no profile exists.
 */
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

/**
 * Public profile view: user header, profile fields, recent created and
 * joined events (joined events exclude the host's own events).
 * @param {string} userId
 * @returns {Promise<{ user: object, profile: object|null, createdEvents: object[], joinedEvents: object[] }>}
 * @throws {Error} If the user is missing or suspended.
 */
export const getPublicProfile = async (userId) => {
    const user = await User.findById(userId).select(
        "userName createdAt status",
    );
    if (!user || user.status === "suspended") throw new Error("User not found");

    const profile = await Profile.findOne({ user: userId }).select(
        "firstName lastName bio profilePicture gender country",
    );

    const [createdEvents, memberships] = await Promise.all([
        Event.find({ hostId: userId, privacy: "public" })
            .select(
                "eventName description location startTime endTime thumbnail uniqueSlug status isPremium",
            )
            .sort({ createdAt: -1 })
            .limit(20),
        EventMembership.find({ userId })
            .populate({
                path: "eventId",
                select: "eventName description location startTime endTime thumbnail uniqueSlug status isPremium hostId privacy",
                match: { privacy: "public" },
            })
            .sort({ joinedAt: -1 })
            .limit(20),
    ]);

    const joinedEvents = memberships
        .map((m) => m.eventId)
        .filter(Boolean)
        .filter((e) => String(e.hostId) !== String(userId));

    return { user, profile, createdEvents, joinedEvents };
};

/**
 * Delete the user's profile, destroying any Cloudinary avatar first.
 * @param {string} userId
 * @returns {Promise<void>}
 * @throws {Error} If no profile exists.
 */
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
