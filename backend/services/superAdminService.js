import { User } from "../models/userModel.js";
import { safeUserForAdmin } from "../utils/helperFunctions.js";

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
