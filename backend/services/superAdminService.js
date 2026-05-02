import { User } from "../models/userModel.js";
import { makeError, safeUserForAdmin } from "../utils/helperFunctions.js";

export const approveAdminUser = async (adminId) => {
    const requestedAdmin = await User.findById(adminId);

    if (!requestedAdmin || requestedAdmin.role != "admin") {
        throw new Error("Admin not found");
    }

    requestedAdmin.adminRequestStatus = "approved";

    if (requestedAdmin.status === "pending") {
        requestedAdmin.status = "active";
    }

    const approvedAdmin = await requestedAdmin.save();

    return await safeUserForAdmin(approvedAdmin);
};

export const getAdminsList = async (searchTerm) => {
    const q = { role: "admin" };
    if (searchTerm) {
        q.$or = [
            { email: { $regex: searchTerm, $options: "i" } },
            { userName: { $regex: searchTerm, $options: "i" } },
        ];
    }
    const filteredAdmin = await User.find(q)
        .sort({ createdAt: -1 })
        .limit(500)
        .select("_id userName email role status createdAt");
    return filteredAdmin;
};

export const suspendAdmin = async (adminId, suspensionReason) => {
    const target = await User.findById(adminId);

    if (!target) {
        throw makeError(404, "Admin not found");
    }

    if (target.role !== "admin") {
        throw makeError(400, "Target must be an admin");
    }

    if (!suspensionReason || !suspensionReason.trim()) {
        throw makeError(400, "Suspension reason is required");
    }

    if (target.status === "pending") {
        throw makeError(400, "Admin yet to be approved.");
    }

    if (target.status === "suspended") {
        throw makeError(400, "Admin already suspended.");
    }

    target.status = "suspended";
    target.adminRequestStatus = "suspended";
    target.adminActionReason = suspensionReason.trim();

    await target.save();

    return await User.findById(adminId).select(
        "_id userName email role status adminRequestStatus adminActionReason updatedAt",
    );
};
