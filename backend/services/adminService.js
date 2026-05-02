import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { makeError, safeUserForAdmin } from "../utils/helperFunctions.js";
import {
    createOtpRecord,
    findValidOtp,
    generateNumericOtp,
    hashOtp,
} from "./otpService.js";

export async function registerAdmin({ userName, email, password }) {
    if (!userName || !email || !password) {
        throw makeError(400, "userName, email, and password are required");
    }

    const emailLower = String(email).toLowerCase();
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
        throw makeError(409, "Email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await User.create({
        userName: String(userName).trim(),
        email: emailLower,
        password: hashedPassword,
        role: "admin",
        status: "pending",
        adminRequestStatus: "pending",
    });

    return safeUserForAdmin(newAdmin);
}

export async function verifyAdminCredentials({ email, password, otp }) {
    if (!email || !password)
        throw makeError(400, "Email and Password required");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) throw makeError(400, "Invalid email or password");

    // Role and Status Checks
    if (!["admin", "superadmin"].includes(user.role))
        throw makeError(403, "Access denied");
    if (user.role === "admin" && user.adminRequestStatus !== "approved")
        throw makeError(403, "Admin access not approved");
    if (["suspended", "banned"].includes(user.status))
        throw makeError(403, `Account ${user.status}`);

    // Password Check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw makeError(400, "Invalid email or password");

    // Superadmins bypass MFA
    if (user.role === "superadmin") {
        return { mfaRequired: false, user };
    }

    // Handle Admin MFA
    if (!otp) {
        const code = generateNumericOtp(6);
        const otpHash = hashOtp(user.email, code);
        await createOtpRecord(user.email, otpHash);
        return { mfaRequired: true, user, otpCode: code }; // Return code to controller for emailing
    }

    // Verify OTP
    const otpDoc = await findValidOtp(user.email);
    if (!otpDoc) throw makeError(400, "OTP expired or not found");
    if (otpDoc.attemptsLeft <= 0)
        throw makeError(429, "Too many attempts. Request a new OTP.");

    const providedHash = hashOtp(user.email, String(otp));
    if (otpDoc.otpHash !== providedHash) {
        otpDoc.attemptsLeft -= 1;
        await otpDoc.save();
        throw makeError(400, "Invalid OTP");
    }

    otpDoc.consumedAt = new Date();
    await otpDoc.save();

    return { mfaRequired: false, user };
}

export async function getUsersList(searchTerm) {
    const q = { role: "user" };
    const normalizedSearch = searchTerm.trim();
    if (normalizedSearch) {
        q.$or = [
            { email: { $regex: normalizedSearch, $options: "i" } },
            { userName: { $regex: normalizedSearch, $options: "i" } },
        ];
    }

    return await User.find(q)
        .sort({ createdAt: -1 })
        .limit(500)
        .select(
            "userName email role status suspensionCount adminActionReason updatedAt",
        );
}

const handleUserStatusUpdate = ({
    userId,
    reason,
    requireSuspended = false,
    blockIfSuspended = false,
    newStatus,
}) => {
    return (async () => {
        const target = await User.findById(userId);

        if (!target) throw makeError(404, "User not found");

        if (target.role !== "user") {
            throw makeError(400, "Target must be a user");
        }

        if (target.status === "pending") {
            throw makeError(400, "User has not been verified");
        }

        if (blockIfSuspended && target.status === "suspended") {
            throw makeError(400, "User is already suspended");
        }

        if (requireSuspended && target.status !== "suspended") {
            throw makeError(400, "User is not suspended");
        }

        // apply updates
        target.status = newStatus;
        target.adminActionReason = reason;

        if (blockIfSuspended) target.suspensionCount += 1;

        await target.save();

        return await User.findById(userId).select(
            "_id userName email role status adminActionReason updatedAt",
        );
    })();
};

// Suspend
export const suspendUser = (userId, reason) =>
    handleUserStatusUpdate({
        userId,
        reason,
        newStatus: "suspended",
        blockIfSuspended: true,
    });

// Unsuspend
export const unsuspendUser = (userId, reason) =>
    handleUserStatusUpdate({
        userId,
        reason,
        newStatus: "active",
        requireSuspended: true,
    });
