import express from "express";
import {
    activateUser,
    loginUser,
    reactivateUser,
    registerUser,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.get("/activate", activateUser);
router.post("/resend-activation", reactivateUser);

export default router;
