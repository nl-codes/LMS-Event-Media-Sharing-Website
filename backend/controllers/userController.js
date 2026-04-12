import {
    addUsers,
    requestPasswordReset,
    resendActivationToken,
    resetPassword,
    verifyUser,
    verifyUserActivationToken,
} from "../services/userService.js";
import { generateGeneralToken } from "../utils/generateToken.js";
import { generateJWTtoken } from "../utils/auth/generateJWTtoken.js";
import {
    getActivationEmailHTML,
    getPasswordResetEmailHTML,
    getReactivationEmailHTML,
} from "../utils/longText.js";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = async (req, res) => {
    try {
        const registeredUser = await addUsers(req.body);
        // console.log(registeredUser);
        const { token, tokenHash, expires } = generateGeneralToken();
        registeredUser.activationToken = tokenHash;
        registeredUser.activationExpires = expires;
        registeredUser.status = "pending";

        await registeredUser.save();

        const testMode = true;
        if (testMode) {
            registeredUser.status = "active";
            await registeredUser.save();
        } else {
            const activationUrl = `${process.env.FRONTEND_URL}/signup/activate?token=${token}`;

            await sendEmail(
                registeredUser.email,
                "Activate your account",
                `Your activation link: ${activationUrl}`,
                getActivationEmailHTML(activationUrl),
            );
        }

        res.status(201).json({
            message: "Signup successful. Check email to activate account.",
        });
    } catch (err) {
        let status = 400;
        if (err.message === "Missing required fields") {
            status = 404;
        }
        console.error("❌ Error registering user: ", err);
        res.status(status).json({ error: err.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const loginUser = await verifyUser(req.body);
        const token = generateJWTtoken({
            email: loginUser.email,
            userName: loginUser.userName,
            role: "user",
            id: loginUser._id,
        });
        res.cookie("token", token, {
            httpOnly: true, // Prevents JS access (XSS protection)
            secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
            sameSite: "lax", // Or "strict" for more security
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day (adjust as needed)
            path: "/",
        });
        res.status(200).json({ message: "Login Successful" });
    } catch (err) {
        let status = 400;
        if (
            err.message === "Account activation pending. Check your email" ||
            err.message === "Account suspended"
        ) {
            status = 403;
        }
        console.error("❌ Error on login: ", err.message);
        res.status(status).json({ error: err.message });
    }
};

export const activateUser = async (req, res) => {
    const { token } = req.query;
    try {
        if (!token || token == "") {
            throw new Error("Token required");
        }
        await verifyUserActivationToken(token);
        res.json({ message: "Account activated. You can now log in." });
    } catch (err) {
        console.error("❌ Error on activation: ", err);
        res.status(400).json({ error: err.message });
    }
};

export const reactivateUser = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) throw new Error("Email is required.");

        const { user, token } = await resendActivationToken(email);

        const activationUrl = `${process.env.FRONTEND_URL}/signup/activate?token=${token}`;

        await sendEmail(
            user.email,
            "Activate Your Account — Link Resent",
            `Your activation link: ${activationUrl}`,
            getReactivationEmailHTML(activationUrl),
        );

        res.json({ message: "Activation link resent." });
    } catch (err) {
        console.error("❌ Error resending activation link: ", err);
        res.status(400).json({ error: err.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) throw new Error("Email is required");

        const { user, token } = await requestPasswordReset(email);
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

        await sendEmail(
            user.email,
            "Reset your password",
            `Reset link: ${resetUrl}`,
            getPasswordResetEmailHTML(resetUrl),
        );

        res.json({ message: "Password reset link sent" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const resetPasswordController = async (req, res) => {
    try {
        const { token } = req.query;
        const { password } = req.body;

        if (!token || !password) {
            throw new Error("Token and password required");
        }

        await resetPassword(token, password);
        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const logoutUser = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
    res.json({ message: "Logged out successfully" });
};

export const getMe = (req, res) => {
    // req.user is set by requireAuth middleware
    res.json({
        _id: req.user.id,
        email: req.user.email,
        userName: req.user.userName,
        role: req.user.role,
    });
};
