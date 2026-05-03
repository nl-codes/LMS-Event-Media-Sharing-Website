import {
    getEventsList,
    getUsersList,
    registerAdmin,
    suspendUser,
    unsuspendUser,
    verifyAdminCredentials,
} from "../services/adminService.js";
import { setAuthCookie } from "../utils/auth/cookieAuth.js";
import { generateJWTtoken } from "../utils/auth/generateJWTtoken.js";
import sendEmail from "../utils/sendEmail.js";

export async function registerAdminController(req, res) {
    try {
        const user = await registerAdmin(req.body || {});

        return res.status(201).json({
            success: true,
            message:
                "Admin registration submitted. SuperAdmin will review your request.",
            data: user,
        });
    } catch (err) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message,
        });
    }
}

export async function loginAdminController(req, res) {
    try {
        const { email, password, otp } = req.body;

        const result = await verifyAdminCredentials({
            email,
            password,
            otp,
        });

        // Scenario 1: OTP is required and was just generated
        let SuccessMessage;
        if (result.mfaRequired) {
            if (process.env.NODE_ENV === "development") {
                SuccessMessage =
                    "Development Mode: Check Backend Console for OTP.";
                console.log(
                    "Printing OTP in console just for development mode.",
                );
                console.log(
                    `OTP for login of ${result.user.email} is:  ${result.otpCode}`,
                );
            } else {
                SuccessMessage = "OTP sent to email";
                await sendEmail(
                    result.user.email,
                    "Your Admin Login OTP",
                    `Your OTP is: ${result.otpCode}`,
                    `<p>Your OTP is <b>${result.otpCode}</b>. It expires in 10 minutes.</p>`,
                );
            }

            return res.status(200).json({
                success: true,
                message: SuccessMessage,
                mfaRequired: true,
            });
        }

        // Scenario 2: Login successful (Superadmin or Admin with valid OTP)
        const token = generateJWTtoken({
            email: result.user.email,
            userName: result.user.userName,
            role: result.user.role,
            id: result.user._id,
        });

        setAuthCookie(res, token);

        return res.status(200).json({
            success: true,
            message: "Login Successful",
            data: {
                role: result.user.role,
                redirectTo:
                    result.user.role === "superadmin"
                        ? "/super-admin/home"
                        : "/admin/home",
            },
        });
    } catch (err) {
        const status = err.statusCode || 500;
        return res.status(status).json({
            success: false,
            message: err.message,
        });
    }
}

export async function getUsersListController(req, res) {
    try {
        const search = String(req.query.search || "").trim();
        const users = await getUsersList(search);
        return res
            .status(200)
            .json({ success: true, count: users.length, data: users });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}

// Util function used to call both suspendUser and unsuspendUser service functions
const handleUserAction = (actionFn, successMessage) => {
    return async (req, res) => {
        try {
            const { userId, reason } = req.body || {};

            if (!userId || !userId.trim() || !reason || !reason.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "userId and reason are required",
                });
            }

            const updated = await actionFn(userId, reason);

            return res.status(200).json({
                success: true,
                message: successMessage,
                data: updated,
            });
        } catch (err) {
            return res.status(err.statusCode || 500).json({
                success: false,
                message: err.message,
            });
        }
    };
};

export const suspendUserController = handleUserAction(
    suspendUser,
    "User suspended",
);

export const unsuspendUserController = handleUserAction(
    unsuspendUser,
    "User un-suspended",
);

export async function getEventsListController(req, res) {
    try {
        const events = await getEventsList(req.query.search, req.query.tier);

        return res
            .status(200)
            .json({ success: true, count: events.length, data: events });
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            success: false,
            message: err.message,
        });
    }
}
