import express from "express";
import {
    activateUser,
    loginUser,
    registerUser,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/activate", activateUser);

export default router;
