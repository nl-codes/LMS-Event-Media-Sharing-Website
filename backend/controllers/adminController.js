import { registerAdmin } from "../services/adminService.js";

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
