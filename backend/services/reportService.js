import mongoose from "mongoose";
import Report from "../models/reportModel.js";
import Media from "../models/mediaModel.js";
import Interaction from "../models/interactionModel.js";
import { User } from "../models/userModel.js";
import { Profile } from "../models/profileModel.js";
import { makeError } from "../utils/helperFunctions.js";
import { createNotification } from "./notificationService.js";
import { suspendUser } from "./adminService.js";
import { enqueueEmailJob } from "../queues/emailQueue.js";
import { getSuspensionEmailHTML } from "../utils/longText.js";
import { attachAvatars } from "../utils/attachAvatars.js";

/**
 * @module services/reportService
 * @description Moderation over the polymorphic Report model. On create →
 * notify admins; on verify → run the verdict action (hideMedia /
 * deleteComment / suspendUser) and notify reporter; suspendUser also
 * emails the affected user.
 */

const TARGET_MODELS = {
    Media,
    Interaction,
    User,
};

const validateObjectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw makeError(400, `Invalid ${label}`);
    }
};

async function assertTargetExists(targetType, targetId) {
    const Model = TARGET_MODELS[targetType];
    if (!Model) throw makeError(400, "Invalid target type");
    const exists = await Model.findById(targetId).select("_id");
    if (!exists) throw makeError(404, `${targetType} not found`);
}

async function notifyAllAdmins(message, link, type) {
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
 * File a new moderation report and fan a "report_filed" notification out
 * to all admins/superadmins.
 * @param {{ reporterId: string, targetId: string, targetType: "Media"|"Interaction"|"User", reason: string, description?: string }} input
 * @returns {Promise<import("mongoose").Document>} The persisted Report.
 * @throws {Error} 400 on invalid ids/target type, 404 if target missing.
 */
export async function createReport({
    reporterId,
    targetId,
    targetType,
    reason,
    description = "",
}) {
    validateObjectId(reporterId, "reporter id");
    validateObjectId(targetId, "target id");

    if (!reason || !String(reason).trim()) {
        throw makeError(400, "Reason is required");
    }
    if (!["Media", "Interaction", "User"].includes(targetType)) {
        throw makeError(400, "Invalid target type");
    }

    await assertTargetExists(targetType, targetId);

    const report = await Report.create({
        reporterId,
        targetId,
        targetType,
        reason: String(reason).trim(),
        description: String(description || "").trim(),
    });

    await notifyAllAdmins(
        `New ${targetType} report filed`,
        `/report/${report._id}`,
        "report_filed",
    );

    return report;
}

/**
 * Admin moderation queue (newest first, capped at 500).
 * @param {{ status?: string, targetType?: string }} [filters]
 * @returns {Promise<object[]>}
 */
export async function listReports({ status, targetType } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (targetType) filter.targetType = targetType;

    return Report.find(filter)
        .sort({ createdAt: -1 })
        .limit(500)
        .populate("reporterId", "userName email")
        .populate("verifiedBy", "userName email");
}

/**
 * Detail view: report row + hydrated target. For User targets the response
 * includes `profilePicture` so the UI can link the avatar to the profile.
 * @param {string} reportId
 * @returns {Promise<{ report: object, target: object|null }>}
 * @throws {Error} 404 if missing.
 */
export async function getReportById(reportId) {
    validateObjectId(reportId, "report id");

    const report = await Report.findById(reportId)
        .populate("reporterId", "userName email")
        .populate("verifiedBy", "userName email");

    if (!report) throw makeError(404, "Report not found");

    let targetDoc = null;
    const Model = TARGET_MODELS[report.targetType];
    if (Model) {
        if (report.targetType === "Media") {
            targetDoc = await Model.findById(report.targetId)
                .populate("uploaderId", "userName email")
                .populate("guestId", "userName guest_id")
                .populate(
                    "eventId",
                    "eventName tier privacy startTime endTime status",
                );

            if (targetDoc) {
                if (targetDoc.uploaderId) {
                    await attachAvatars(targetDoc, ["uploaderId"]);
                }

                if (!targetDoc.uploaderId && targetDoc.guestId) {
                    const plain = targetDoc.toObject();
                    plain.uploaderId = {
                        _id: targetDoc.guestId._id,
                        userName: targetDoc.guestId.userName,
                        profilePicture: "",
                        isGuest: true,
                    };
                    targetDoc = plain;
                }
            }
        } else if (report.targetType === "Interaction") {
            targetDoc = await Model.findById(report.targetId).populate(
                "author",
                "userName email",
            );
        } else if (report.targetType === "User") {
            const userDoc = await Model.findById(report.targetId)
                .select("userName email status")
                .lean();
            if (userDoc) {
                const profile = await Profile.findOne({ user: userDoc._id })
                    .select("profilePicture")
                    .lean();
                userDoc.profilePicture = profile?.profilePicture || "";
            }
            targetDoc = userDoc;
        }
    }

    return { report, target: targetDoc };
}

/**
 * All hidden Media uploaded by a given user (admin moderation view).
 * @param {string} userId
 * @returns {Promise<object[]>}
 */
export async function listFlaggedMediaForUser(userId) {
    validateObjectId(userId, "user id");

    const mediaIds = await Media.find({
        uploaderId: userId,
        isHidden: true,
    })
        .select("_id mediaUrl mediaType label hiddenReason createdAt")
        .sort({ createdAt: -1 });

    return mediaIds;
}

async function performHideMedia(report, admin, reasoning) {
    const media = await Media.findById(report.targetId);
    if (!media) throw makeError(404, "Media not found");

    media.isHidden = true;
    media.hiddenReason = reasoning;
    await media.save();

    if (media.uploaderId) {
        await createNotification({
            recipientId: media.uploaderId,
            message: `Your media has been hidden by an admin. Reason: ${reasoning}`,
            type: "media_hidden",
            link: `/report/${report._id}`,
        });
    }
}

async function performDeleteComment(report, admin, reasoning) {
    const comment = await Interaction.findById(report.targetId);
    if (!comment) throw makeError(404, "Comment not found");
    if (comment.type !== "comment") {
        throw makeError(400, "Target is not a comment");
    }

    const ownerId = comment.author;
    await comment.deleteOne();

    if (ownerId) {
        await createNotification({
            recipientId: ownerId,
            message: `Your comment was removed by an admin. Reason: ${reasoning}`,
            type: "comment_deleted",
            link: `/report/${report._id}`,
        });
    }
}

async function performSuspendUser(report, admin, reasoning) {
    let userId = report.targetId;

    if (report.targetType === "Media") {
        const media = await Media.findById(report.targetId).select(
            "uploaderId",
        );
        if (!media?.uploaderId) {
            throw makeError(400, "Media has no uploader to suspend");
        }
        userId = media.uploaderId;
    } else if (report.targetType === "Interaction") {
        const interaction = await Interaction.findById(report.targetId).select(
            "author",
        );
        if (!interaction?.author) {
            throw makeError(400, "Interaction has no author to suspend");
        }
        userId = interaction.author;
    }

    await suspendUser(userId, reasoning);

    const user = await User.findById(userId).select("email userName");
    if (user) {
        await createNotification({
            recipientId: user._id,
            message: `Your account has been suspended. Reason: ${reasoning}`,
            type: "user_suspended",
            link: `/request/unsuspend`,
        });

        const appealUrl = `${process.env.FRONTEND_URL || ""}/request/unsuspend`;
        try {
            await enqueueEmailJob({
                to: user.email,
                subject: "Your account has been suspended",
                text: `Hello ${user.userName},\n\nYour account has been suspended for the following reason:\n${reasoning}\n\nYou may appeal at: ${appealUrl}`,
                html: getSuspensionEmailHTML(
                    user.userName,
                    reasoning,
                    appealUrl,
                ),
            });
        } catch (err) {
            console.error("Failed to send suspension email:", err.message);
        }
    }
}

const ACTION_HANDLERS = {
    hideMedia: performHideMedia,
    deleteComment: performDeleteComment,
    suspendUser: performSuspendUser,
};

/**
 * Apply an admin verdict to a pending report. Dispatches the action
 * handler (hideMedia / deleteComment / suspendUser) then closes the
 * report and notifies the reporter.
 * @param {{ reportId: string, adminId: string, reasoning: string, action: "hideMedia"|"deleteComment"|"suspendUser" }} input
 * @returns {Promise<import("mongoose").Document>} The closed Report.
 * @throws {Error} 400 on bad input or status, 404 on missing report.
 */
export async function verifyReport({ reportId, adminId, reasoning, action }) {
    validateObjectId(reportId, "report id");
    validateObjectId(adminId, "admin id");

    if (!reasoning || !String(reasoning).trim()) {
        throw makeError(400, "Reasoning is required");
    }
    if (!action || !ACTION_HANDLERS[action]) {
        throw makeError(400, "Valid action is required");
    }

    const report = await Report.findById(reportId);
    if (!report) throw makeError(404, "Report not found");
    if (report.status !== "pending") {
        throw makeError(400, "Report already processed");
    }

    const trimmedReasoning = String(reasoning).trim();

    if (action === "hideMedia" && report.targetType !== "Media") {
        throw makeError(400, "hideMedia requires a Media report");
    }
    if (action === "deleteComment" && report.targetType !== "Interaction") {
        throw makeError(400, "deleteComment requires an Interaction report");
    }

    await ACTION_HANDLERS[action](report, adminId, trimmedReasoning);

    report.status = "verified";
    report.verifiedBy = adminId;
    report.adminReasoning = trimmedReasoning;
    report.adminAction = action;
    await report.save();

    await createNotification({
        recipientId: report.reporterId,
        message: `Your report was verified. Action taken: ${action}`,
        type: "report_verified",
        link: `/report/${report._id}`,
    });

    return report;
}

/**
 * Close a pending report as dismissed and notify the reporter.
 * @param {{ reportId: string, adminId: string, reasoning: string }} input
 * @returns {Promise<import("mongoose").Document>} The closed Report.
 * @throws {Error} 400 on bad input/status, 404 on missing report.
 */
export async function dismissReport({ reportId, adminId, reasoning }) {
    validateObjectId(reportId, "report id");
    validateObjectId(adminId, "admin id");
    if (!reasoning || !String(reasoning).trim()) {
        throw makeError(400, "Reasoning is required");
    }

    const report = await Report.findById(reportId);
    if (!report) throw makeError(404, "Report not found");
    if (report.status !== "pending") {
        throw makeError(400, "Report already processed");
    }

    report.status = "dismissed";
    report.verifiedBy = adminId;
    report.adminReasoning = String(reasoning).trim();
    report.adminAction = "none";
    await report.save();

    await createNotification({
        recipientId: report.reporterId,
        message: `Your report was dismissed.`,
        type: "report_dismissed",
        link: `/report/${report._id}`,
    });

    return report;
}

/**
 * Hard-delete a report row (superadmin housekeeping only).
 * @param {string} reportId
 * @returns {Promise<{ deletedId: string }>}
 * @throws {Error} 404 if missing.
 */
export async function deleteReport(reportId) {
    validateObjectId(reportId, "report id");
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) throw makeError(404, "Report not found");
    return { deletedId: reportId };
}
