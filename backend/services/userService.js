import { User } from "../models/userModel.js";
import bcrypt from "bcryptjs";

export const addUsers = async ({
    firstName,
    lastName,
    userName,
    email,
    password,
}) => {
    if (!firstName || !lastName || !userName || !email || !password) {
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
        firstName: firstName,
        lastName: lastName,
        userName: userName,
        password: hashedPassword,
        email: email,
    });

    return await newUser.save();
};
