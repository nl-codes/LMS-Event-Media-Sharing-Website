import {
    registerAdmin,
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
        if (result.mfaRequired) {
            await sendEmail(
                result.user.email,
                "Your Admin Login OTP",
                `Your OTP is: ${result.otpCode}`,
                `<p>Your OTP is <b>${result.otpCode}</b>. It expires in 10 minutes.</p>`,
            );

            return res.status(200).json({
                success: true,
                message: "OTP sent to email",
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
