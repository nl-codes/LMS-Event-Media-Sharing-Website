import {
    addUsers,
    resendActivationToken,
    verifyUser,
    verifyUserActivationToken,
} from "../services/userService.js";
import { generateGeneralToken } from "../utils/generateToken.js";
import { generateJWTtoken } from "../utils/auth/generateJWTtoken.js";
import {
    getActivationEmailHTML,
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

        const activationUrl = `${process.env.FRONTEND_URL}/signup/activate?token=${token}`;

        await sendEmail(
            registeredUser.email,
            "Activate your account",
            `Your activation link: ${activationUrl}`,
            getActivationEmailHTML(activationUrl)
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
        const token = generateJWTtoken({
            email: loginUser.email,
            userName: loginUser.userName,
        });
        res.status(200).json({ messge: "Login Successful", token: token });
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
            getReactivationEmailHTML(activationUrl)
        );

        res.json({ message: "Activation link resent." });
    } catch (err) {
        console.error("❌ Error resending activation link: ", err);
        res.status(400).json({ error: err.message });
    }
};
