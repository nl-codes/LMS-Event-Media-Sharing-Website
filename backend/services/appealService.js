import mongoose from "mongoose";
import Appeal from "../models/appealModel.js";
import { Event } from "../models/eventModel.js";
import { User } from "../models/userModel.js";
import { makeError } from "../utils/helperFunctions.js";
import { unsuspendUser } from "./adminService.js";
import { enqueueEmailJob } from "../queues/emailQueue.js";
import { createNotification } from "./notificationService.js";
import {
    getAppealApprovedEmailHTML,
    getAppealRejectedEmailHTML,
} from "../utils/longText.js";

/**
 * @module services/appealService
 * @description Unsuspension-appeal workflow. createAppeal returns null
 * (not throws) for unknown/non-suspended emails so the controller can
 * respond uniformly and avoid leaking account existence.
 */

const validateObjectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw makeError(400, `Invalid ${label}`);
    }
};

async function notifyAllAdmins(message, link, type = "system") {
    const admins = await User.find({
        role: { $in: ["admin", "superadmin"] },
    }).select("_id");

    await Promise.all(
        admins.map((admin) =>
            createNotification({
                recipientId: admin._id,
                message,
                link,
                type,
            }),
        ),
    );
}

/**
 * File a new unsuspension appeal.
 * @param {{ email: string, appealMessage: string }} input
 * @returns {Promise<{ appeal: import("mongoose").Document, user: import("mongoose").Document }|null>}
 *   null when the email doesn't map to a suspended user or the user already
 *   has a pending appeal (controller treats this as success).
 * @throws {Error} 400 on missing fields.
 */
export async function createAppeal({ email, appealMessage }) {
    const emailLower = String(email || "")
        .toLowerCase()
        .trim();
    if (!emailLower || !appealMessage?.trim()) {
        throw makeError(400, "Email and appeal message are required");
    }
    const user = await User.findOne({
        email: { $regex: new RegExp(`^${emailLower}$`, "i") },
    });

    if (!user || user.status !== "suspended") {
        return null;
    }

    // Prevent duplicate pending appeals from the same user
    const existingPending = await Appeal.findOne({
        userId: user._id,
        status: "pending",
    });
    if (existingPending) {
        return null;
    }

    const appeal = await Appeal.create({
        userId: user._id,
        email: emailLower,
        appealMessage: String(appealMessage).trim(),
    });

    return { appeal, user };
}

/**
 * Host files an appeal for a suspended/cancelled event.
 * @param {{ eventId: string, hostId: string, appealMessage: string }} input
 * @returns {Promise<import("mongoose").Document>}
 */
export async function createEventAppeal({ eventId, hostId, appealMessage }) {
    validateObjectId(eventId, "event id");
    validateObjectId(hostId, "host id");

    if (!appealMessage?.trim()) {
        throw makeError(400, "Appeal message is required");
    }

    const event = await Event.findById(eventId).populate(
        "hostId",
        "_id userName email",
    );

    if (!event) {
        throw makeError(404, "Event not found");
    }

    if (String(event.hostId?._id || event.hostId) !== String(hostId)) {
        throw makeError(403, "Only the event host can appeal this event");
    }

    if (event.status !== "Cancelled") {
        throw makeError(400, "Only suspended events can be appealed");
    }

    const existingPending = await Appeal.findOne({
        appealType: "event",
        eventId: event._id,
        status: "pending",
    });
    if (existingPending) {
        throw makeError(400, "This event already has a pending appeal");
    }

    const appeal = await Appeal.create({
        appealType: "event",
        eventId: event._id,
        userId: event.hostId._id,
        email: event.hostId.email,
        appealMessage: String(appealMessage).trim(),
    });

    await notifyAllAdmins(
        `Event appeal filed for "${event.eventName}"`,
        "/admin/appeals",
        "event_appeal_filed",
    );

    return appeal;
}

/**
 * Counts per status, for the admin-appeals tabs.
 * @returns {Promise<{ pending: number, approved: number, rejected: number }>}
 */
export async function getAppealCounts() {
    const [pending, approved, rejected] = await Promise.all([
        Appeal.countDocuments({ status: "pending" }),
        Appeal.countDocuments({ status: "approved" }),
        Appeal.countDocuments({ status: "rejected" }),
    ]);
    return { pending, approved, rejected };
}

/**
 * Admin appeals queue (newest first, capped at 500).
 * @param {{ status?: string }} [filters] Pass "all" or omit for everything.
 * @returns {Promise<object[]>}
 */
export async function listAppeals({ status } = {}) {
    const filter = {};
    if (status && status !== "all") filter.status = status;

    return Appeal.find(filter)
        .sort({ createdAt: -1 })
        .limit(500)
        .populate("userId", "userName email status adminActionReason")
        .populate("eventId", "eventName status adminActionReason uniqueSlug")
        .populate("reviewedBy", "userName email");
}

/**
 * Approve an appeal: unsuspends the user (if still suspended) and emails
 * them the approval template. Email failures are swallowed.
 * @param {{ appealId: string, adminId: string, adminNote?: string }} input
 * @returns {Promise<import("mongoose").Document>} The closed Appeal.
 * @throws {Error} 404 if missing, 400 if already reviewed.
 */
export async function approveAppeal({ appealId, adminId, adminNote }) {
    validateObjectId(appealId, "appeal id");
    validateObjectId(adminId, "admin id");

    const appeal = await Appeal.findById(appealId)
        .populate("userId", "userName email status")
        .populate("eventId", "eventName status");
    if (!appeal) throw makeError(404, "Appeal not found");
    if (appeal.status !== "pending") {
        throw makeError(400, "Appeal already reviewed");
    }

    const note = String(adminNote || "").trim();

    if (appeal.appealType === "event") {
        if (!appeal.eventId) {
            throw makeError(404, "Event not found");
        }

        appeal.eventId.status = "Active";
        appeal.eventId.adminActionReason = "";
        await appeal.eventId.save();

        appeal.status = "approved";
        appeal.reviewedBy = adminId;
        appeal.adminNote = note;
        await appeal.save();

        await createNotification({
            recipientId: appeal.userId._id,
            message: `Your appeal for "${appeal.eventId.eventName}" was approved. The event has been restored.`,
            type: "event_appeal_approved",
            link: `/home/events/${appeal.eventId._id}`,
        });

        return appeal;
    }

    // Only unsuspend if still suspended — user may have been manually restored
    if (appeal.userId.status === "suspended") {
        await unsuspendUser(
            String(appeal.userId._id),
            note || "Appeal approved by admin",
        );
    }

    appeal.status = "approved";
    appeal.reviewedBy = adminId;
    appeal.adminNote = note;
    await appeal.save();

    const loginUrl = `${process.env.FRONTEND_URL || ""}/login`;
    try {
        await enqueueEmailJob({
            to: appeal.userId.email,
            subject: "Your appeal has been approved",
            text: `Hello ${appeal.userId.userName},\n\nGreat news! Your appeal to lift the suspension on your account has been approved.\n\nYou can now log in at: ${loginUrl}\n\n${note ? `Admin note: ${note}` : ""}`,
            html: getAppealApprovedEmailHTML(
                appeal.userId.userName,
                note,
                loginUrl,
            ),
        });
    } catch (err) {
        console.error("Failed to send appeal approval email:", err.message);
    }

    return appeal;
}

/**
 * Reject an appeal: user stays suspended; emails the rejection template
 * with the optional admin note.
 * @param {{ appealId: string, adminId: string, adminNote?: string }} input
 * @returns {Promise<import("mongoose").Document>} The closed Appeal.
 * @throws {Error} 404 if missing, 400 if already reviewed.
 */
export async function rejectAppeal({ appealId, adminId, adminNote }) {
    validateObjectId(appealId, "appeal id");
    validateObjectId(adminId, "admin id");

    const appeal = await Appeal.findById(appealId)
        .populate("userId", "userName email status")
        .populate("eventId", "eventName status");
    if (!appeal) throw makeError(404, "Appeal not found");
    if (appeal.status !== "pending") {
        throw makeError(400, "Appeal already reviewed");
    }

    const note = String(adminNote || "").trim();

    appeal.status = "rejected";
    appeal.reviewedBy = adminId;
    appeal.adminNote = note;
    await appeal.save();

    if (appeal.appealType === "event") {
        await createNotification({
            recipientId: appeal.userId._id,
            message: `Your appeal for "${appeal.eventId?.eventName || "your event"}" was rejected.${note ? ` Reason: ${note}` : ""}`,
            type: "event_appeal_rejected",
            link: `/home/events/${appeal.eventId?._id || ""}`,
        });

        return appeal;
    }

    try {
        await enqueueEmailJob({
            to: appeal.userId.email,
            subject: "Your appeal has been rejected",
            text: `Hello ${appeal.userId.userName},\n\nAfter review, your suspension appeal has been rejected.\n\n${note ? `Reason: ${note}` : ""}\n\nIf you have further questions, please contact support.`,
            html: getAppealRejectedEmailHTML(appeal.userId.userName, note),
        });
    } catch (err) {
        console.error("Failed to send appeal rejection email:", err.message);
    }

    return appeal;
}
