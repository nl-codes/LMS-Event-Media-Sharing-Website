import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import { safeUserForAdmin } from "../utils/helperFunctions.js";

function makeError(statusCode, message) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

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
