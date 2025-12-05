import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";

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
    return existingUser;
};
