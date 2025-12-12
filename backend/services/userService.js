import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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
        existingUser.password
    );

    if (!isPasswordCorrect) {
        throw new Error("Invalid email or password");
    }

    if (existingUser.status === "pending") {
        throw new Error("Account activation pending");
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
    await user.save();
};
