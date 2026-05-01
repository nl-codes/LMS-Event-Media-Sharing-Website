import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateGeneralToken } from "../utils/generateToken.js";
import { passwordRegex } from "../utils/validators.js";

export const addUsers = async ({ userName, email, password }) => {
    if (!userName || !email || !password) {
        throw new Error("Missing required fields");
    }
    const existingUser = await User.findOne({
        email: email,
    });

    if (existingUser) {
        throw new Error("User email already exists");
    }

    if (!passwordRegex.test(password)) {
        throw new Error(
            "Password must contain at least: 1 uppercase, 1 lowercase, 1 number and 1 special character",
        );
    }
    const randomSalt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, randomSalt);

    const newUser = new User({
        userName: userName,
        password: hashedPassword,
        email: email,
    });

    return await newUser.save();
};

export const verifyUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error("Email and Password required");
    }
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
        throw new Error("Invalid email or password");
    }

    const isPasswordCorrect = await bcrypt.compare(
        password,
        existingUser.password,
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password");
    }

    if (existingUser.status === "pending") {
        throw new Error("Account activation pending. Check your email");
    }
    if (existingUser.status === "suspended") {
        throw new Error("Account suspended");
    }

    return existingUser;
};

export const verifyUserActivationToken = async (token) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        activationToken: tokenHash,
        activationExpires: { $gt: Date.now() },
    });
    console.log(user);
    if (!user) throw new Error("Invalid or expired token");

    user.status = "active";
    user.activationToken = undefined;
    user.activationExpires = undefined;
    user.activationResendCount = undefined;
    user.activationResendLastSentAt = undefined;
    await user.save();
};

export const resendActivationToken = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found.");

    if (user.status === "active") {
        throw new Error("User is already activated.");
    }

    const now = new Date();
    const last = user.activationResendLastSentAt;

    if (last) {
        const isSameDay =
            last.getFullYear() === now.getFullYear() &&
            last.getMonth() === now.getMonth() &&
            last.getDate() === now.getDate();

        if (isSameDay && user.activationResendCount >= 3) {
            throw new Error(
                "You have reached the daily limit (3 activation emails). Try again tomorrow.",
            );
        }
    }

    const { token, tokenHash, expires } = generateGeneralToken();

    user.activationToken = tokenHash;
    user.activationExpires = expires;

    if (!last || last.toDateString() !== now.toDateString()) {
        user.activationResendCount = 1;
    } else {
        user.activationResendCount += 1;
    }

    user.activationResendLastSentAt = now;

    await user.save();

    return { user, token };
};

export const requestPasswordReset = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    if (user.status !== "active") {
        throw new Error("Account not active");
    }

    const now = new Date();
    const last = user.resetPasswordLastRequestedAt;

    if (last && last.toDateString() === now.toDateString()) {
        if (user.resetPasswordRequestCount >= 3) {
            throw new Error("Password reset limit reached for today");
        }
        user.resetPasswordRequestCount += 1;
    } else {
        user.resetPasswordRequestCount = 1;
    }

    const { token, tokenHash, expires } = generateGeneralToken();

    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = expires;
    user.resetPasswordLastRequestedAt = now;

    await user.save();
    return { user, token };
};

export const resetPassword = async (token, newPassword) => {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) throw new Error("Invalid or expired token");
    if (user.password === newPassword)
        throw new Error("Can't use old password");

    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordRequestCount = undefined;
    user.resetPasswordLastRequestedAt = undefined;

    await user.save();
};
