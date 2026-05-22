import mongoose from "mongoose";
import Appeal from "../models/appealModel.js";
import { User } from "../models/userModel.js";
import { makeError } from "../utils/helperFunctions.js";
import { unsuspendUser } from "./adminService.js";
import sendEmail from "../utils/sendEmail.js";
import {
    getAppealApprovedEmailHTML,
    getAppealRejectedEmailHTML,
} from "../utils/longText.js";

const validateObjectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw makeError(400, `Invalid ${label}`);
    }
};

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

export async function getAppealCounts() {
    const [pending, approved, rejected] = await Promise.all([
        Appeal.countDocuments({ status: "pending" }),
        Appeal.countDocuments({ status: "approved" }),
        Appeal.countDocuments({ status: "rejected" }),
    ]);
    return { pending, approved, rejected };
}

export async function listAppeals({ status } = {}) {
    const filter = {};
    if (status && status !== "all") filter.status = status;

    return Appeal.find(filter)
        .sort({ createdAt: -1 })
        .limit(500)
        .populate("userId", "userName email status adminActionReason")
        .populate("reviewedBy", "userName email");
}

export async function approveAppeal({ appealId, adminId, adminNote }) {
    validateObjectId(appealId, "appeal id");
    validateObjectId(adminId, "admin id");

    const appeal = await Appeal.findById(appealId).populate(
        "userId",
        "userName email status",
    );
    if (!appeal) throw makeError(404, "Appeal not found");
    if (appeal.status !== "pending") {
        throw makeError(400, "Appeal already reviewed");
    }

    const note = String(adminNote || "").trim();

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
        await sendEmail(
            appeal.userId.email,
            "Your appeal has been approved",
            `Hello ${appeal.userId.userName},\n\nGreat news! Your appeal to lift the suspension on your account has been approved.\n\nYou can now log in at: ${loginUrl}\n\n${note ? `Admin note: ${note}` : ""}`,
            getAppealApprovedEmailHTML(
                appeal.userId.userName,
                note,
                loginUrl,
            ),
        );
    } catch (err) {
        console.error("Failed to send appeal approval email:", err.message);
    }

    return appeal;
}

export async function rejectAppeal({ appealId, adminId, adminNote }) {
    validateObjectId(appealId, "appeal id");
    validateObjectId(adminId, "admin id");

    const appeal = await Appeal.findById(appealId).populate(
        "userId",
        "userName email status",
    );
    if (!appeal) throw makeError(404, "Appeal not found");
    if (appeal.status !== "pending") {
        throw makeError(400, "Appeal already reviewed");
    }

    const note = String(adminNote || "").trim();

    appeal.status = "rejected";
    appeal.reviewedBy = adminId;
    appeal.adminNote = note;
    await appeal.save();

    try {
        await sendEmail(
            appeal.userId.email,
            "Your appeal has been rejected",
            `Hello ${appeal.userId.userName},\n\nAfter review, your suspension appeal has been rejected.\n\n${note ? `Reason: ${note}` : ""}\n\nIf you have further questions, please contact support.`,
            getAppealRejectedEmailHTML(appeal.userId.userName, note),
        );
    } catch (err) {
        console.error("Failed to send appeal rejection email:", err.message);
    }

    return appeal;
}
