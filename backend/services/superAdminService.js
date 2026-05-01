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
