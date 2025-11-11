import { addUsers } from "../services/userService.js";

export const registerUser = async (req, res) => {
    try {
        await addUsers(req.body);
        res.status(200).json({
            message: "Registration Successfull",
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
