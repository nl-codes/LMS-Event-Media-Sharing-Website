import {
    addUsers,
    verifyUser,
    verifyUserActivationToken,
} from "../services/userService.js";
import { generateActivationToken } from "../utils/activation/generateActivationToken.js";
import { generateToken } from "../utils/auth/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = async (req, res) => {
    try {
        const registeredUser = await addUsers(req.body);
        // console.log(registeredUser);
        const { token, tokenHash, expires } = generateActivationToken();
        registeredUser.activationToken = tokenHash;
        registeredUser.activationExpires = expires;
        registeredUser.status = "pending";

        await registeredUser.save();

        const activationUrl = `${process.env.BACKEND_URL}/users/activate?token=${token}`;

        await sendEmail(
            registeredUser.email,
            "Activate your account",
            `Your activation link: ${activationUrl}`,
            `<div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;"><div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;"><h2 style="text-align: center; color: #333;">Welcome to Our Live Media Sharing 🎉</h2><p style="font-size: 16px; color: #444;">You're almost there! Click the button below to activate your account.</p><div style="text-align: center; margin: 30px 0;"><a href="${activationUrl}"style="background: #4CAF50; color: white; padding: 12px 20px;text-decoration: none; border-radius: 5px; font-weight: bold;">Activate Account</a></div><p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p><p style="word-break: break-all; color: #007BFF;">${activationUrl}</p><hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" /><p style="font-size: 12px; color: #888; text-align: center;">If you did not create this account, you can safely ignore this email.</p></div></div>`
        );

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
        const token = generateToken({
            email: loginUser.email,
            userName: loginUser.userName,
        });
        res.status(200).json({ messge: "Login Successful", token: token });
    } catch (err) {
        let status = 400;
        console.error("❌ Error on login: ", err);
        res.status(status).json({ error: err.message });
    }
};
