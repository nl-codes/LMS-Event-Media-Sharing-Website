import { Event } from "../models/eventModel.js";
import { EventMembership } from "../models/eventMembershipModel.js";
import { Guest } from "../models/guestModel.js";
import { Profile } from "../models/profileModel.js";
import cloudinary from "../config/cloudinaryConfig.js";
import { extractPublicIdFromUrl } from "../utils/helperFunctions.js";
import { attachAvatars } from "../utils/attachAvatars.js";
import { enqueueEventPrivacyJob } from "../queues/eventPrivacyQueue.js";

export const createEvent = async (eventData) => {
    try {
        if (new Date(eventData.startTime) >= new Date(eventData.endTime)) {
            throw new Error("Start time must be before end time");
        }

        const event = new Event(eventData);
        await event.save();

        // Populate host information
        await event.populate("hostId", "userName email");

        return event;
    } catch (error) {
        throw error;
    }
};

export const findEventById = async (eventId) => {
    try {
        const event = await Event.findById(eventId).populate(
            "hostId",
            "userName email",
        );

        if (!event) {
            throw new Error("Event not found");
        }

        return attachAvatars(event, ["hostId"]);
    } catch (error) {
        throw error;
    }
};

export const findAllEventsByHost = async (hostId) => {
    try {
        const events = await Event.find({ hostId })
            .populate("hostId", "userName email")
            .sort({ createdAt: -1 });
        return attachAvatars(events, ["hostId"]);
    } catch (error) {
        throw error;
    }
};

export const findEventBySlug = async (slug) => {
    try {
        const event = await Event.findOne({ uniqueSlug: slug }).populate(
            "hostId",
            "userName email",
        );

        if (!event) {
            throw new Error("Event not found");
        }

        return attachAvatars(event, ["hostId"]);
    } catch (error) {
        throw error;
    }
};

export const updateEvent = async (eventId, updateData, requesterId) => {
    try {
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        // Check if user is the host
        if (event.hostId.toString() !== requesterId) {
            throw new Error(
                "Unauthorized: Only event host can update this event",
            );
        }

        // Validate times if being updated
        if (updateData.startTime || updateData.endTime) {
            const startTime = updateData.startTime
                ? new Date(updateData.startTime)
                : event.startTime;
            const endTime = updateData.endTime
                ? new Date(updateData.endTime)
                : event.endTime;

            if (startTime >= endTime) {
                throw new Error("Start time must be before end time");
            }
        }

        // Handle Image Update
        if (updateData.thumbnail && event.thumbnail) {
            const publicId = extractPublicIdFromUrl(event.thumbnail);
            await cloudinary.uploader.destroy(publicId);
        }

        // Update and save the event
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            updateData,
            { new: true, runValidators: true },
        ).populate("hostId", "userName email");

        return updatedEvent;
    } catch (error) {
        throw error;
    }
};

export const updateEventStatus = async (eventId, status, requesterId) => {
    try {
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        // Check if user is the host
        if (event.hostId.toString() !== requesterId) {
            throw new Error(
                "Unauthorized: Only event host can update event status",
            );
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { status },
            { new: true, runValidators: true },
        ).populate("hostId", "userName email");

        return updatedEvent;
    } catch (error) {
        throw error;
    }
};

export const removeEvent = async (eventId, requesterId) => {
    try {
        const event = await Event.findById(eventId);

        if (!event) {
            throw new Error("Event not found");
        }

        // Check if user is the host
        if (event.hostId.toString() !== requesterId) {
            throw new Error(
                "Unauthorized: Only event host can delete this event",
            );
        }

        await Event.findByIdAndDelete(eventId);
        return { message: "Event deleted successfully" };
    } catch (error) {
        throw error;
    }
};

const MAX_PUBLIC_EVENTS = 100;

export const listPublicEvents = async ({ q, limit } = {}) => {
    const cap = Math.min(
        Math.max(parseInt(limit, 10) || 50, 1),
        MAX_PUBLIC_EVENTS,
    );

    const filter = {
        privacy: "public",
        status: { $ne: "Cancelled" },
    };

    if (q && typeof q === "string" && q.trim()) {
        const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const rx = new RegExp(escaped, "i");
        filter.$or = [{ eventName: rx }, { location: rx }];
    }

    const events = await Event.find(filter)
        .select(
            "eventName description location startTime endTime uniqueSlug status thumbnail tier privacy participantCount",
        )
        .populate("hostId", "userName email")
        .sort({ startTime: -1 })
        .limit(cap)
        .lean();

    return attachAvatars(events, ["hostId"]);
};

// Host-only: list every participant of an event (registered members + guests)
// merged into one shape so the frontend can render them in a single list.
export const getEventParticipants = async (eventId, requesterId) => {
    const event = await Event.findById(eventId).select("hostId");
    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    if (event.hostId.toString() !== requesterId) {
        const err = new Error("Only the event host can view participants");
        err.status = 403;
        throw err;
    }

    const [memberships, guests] = await Promise.all([
        EventMembership.find({ eventId })
            .select("userId joinedAt")
            .populate("userId", "userName")
            .sort({ joinedAt: -1 })
            .lean(),
        Guest.find({ eventId })
            .select("guest_id userName createdAt")
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    const userIds = memberships
        .map((m) =>
            m.userId && typeof m.userId === "object" ? m.userId._id : null,
        )
        .filter(Boolean);

    const profiles = await Profile.find({ user: { $in: userIds } })
        .select("user firstName lastName profilePicture")
        .lean();
    const profileMap = new Map(
        profiles.map((p) => [
            String(p.user),
            {
                firstName: p.firstName || "",
                lastName: p.lastName || "",
                profilePicture: p.profilePicture || "",
            },
        ]),
    );

    const registered = memberships
        .filter((m) => m.userId && typeof m.userId === "object")
        .map((m) => {
            const {
                firstName = "",
                lastName = "",
                profilePicture = "",
            } = profileMap.get(String(m.userId._id)) || {};
            const fullName = `${firstName} ${lastName}`.trim();
            return {
                id: String(m.userId._id),
                name: fullName || m.userId.userName || "Unknown",
                userName: m.userId.userName || "",
                type: "registered",
                profilePicture,
                joinedAt: m.joinedAt,
            };
        });

    const guestEntries = guests.map((g) => ({
        id: g.guest_id,
        name: g.userName || "Guest",
        userName: g.userName || "",
        type: "guest",
        profilePicture: "",
        joinedAt: g.createdAt,
    }));

    return [...registered, ...guestEntries].sort(
        (a, b) => new Date(b.joinedAt) - new Date(a.joinedAt),
    );
};

export const updateEventPrivacy = async (eventId, privacy, requesterId) => {
    if (privacy !== "public" && privacy !== "private") {
        const err = new Error("privacy must be 'public' or 'private'");
        err.status = 400;
        throw err;
    }

    const event = await Event.findById(eventId).select("hostId privacy");
    if (!event) {
        const err = new Error("Event not found");
        err.status = 404;
        throw err;
    }

    if (event.hostId.toString() !== requesterId) {
        const err = new Error("Only the event host can change privacy");
        err.status = 403;
        throw err;
    }

    event.privacy = privacy;
    await event.save();

    const targetIsPublic = privacy === "public";

    let jobId = null;
    let queueError = null;
    try {
        const job = await enqueueEventPrivacyJob({
            eventId: String(event._id),
            privacy,
            targetIsPublic,
        });
        jobId = job.id;
    } catch (err) {
        queueError = err.message || "Failed to queue privacy sync";
        console.error(
            `Failed to enqueue privacy job for event ${event._id}:`,
            queueError,
        );
    }

    return {
        event: {
            _id: String(event._id),
            privacy: event.privacy,
        },
        jobId,
        targetIsPublic,
        queueError,
    };
};
