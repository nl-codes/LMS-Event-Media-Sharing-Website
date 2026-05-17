import mongoose from "mongoose";
import Report from "../models/reportModel.js";
import Media from "../models/mediaModel.js";
import Interaction from "../models/interactionModel.js";
import { User } from "../models/userModel.js";
import { makeError } from "../utils/helperFunctions.js";
import { createNotification } from "./notificationService.js";
import { suspendUser } from "./adminService.js";
import sendEmail from "../utils/sendEmail.js";

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
                .populate("eventId", "eventName");
        } else if (report.targetType === "Interaction") {
            targetDoc = await Model.findById(report.targetId).populate(
                "author",
                "userName email",
            );
        } else if (report.targetType === "User") {
            targetDoc = await Model.findById(report.targetId).select(
                "userName email status",
            );
        }
    }

    return { report, target: targetDoc };
}

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
            await sendEmail(
                user.email,
                "Your account has been suspended",
                `Hello ${user.userName},\n\nYour account has been suspended for the following reason:\n${reasoning}\n\nYou may appeal at: ${appealUrl}`,
                `<p>Hello <b>${user.userName}</b>,</p>
                 <p>Your account has been suspended for the following reason:</p>
                 <blockquote>${reasoning}</blockquote>
                 <p>If you believe this was a mistake, you can <a href="${appealUrl}">file an appeal</a>.</p>`,
            );
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

export async function verifyReport({
    reportId,
    adminId,
    reasoning,
    action,
}) {
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

export async function deleteReport(reportId) {
    validateObjectId(reportId, "report id");
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) throw makeError(404, "Report not found");
    return { deletedId: reportId };
}
