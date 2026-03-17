import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./database/connection.js";
import userRoutes from "./routes/userRoute.js";
import profileRoutes from "./routes/profileRoute.js";
import eventRoutes from "./routes/eventRoute.js";
import mediaRouter from "./routes/mediaRoute.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    }),
);

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

connectDB();

app.use("/users", userRoutes);
app.use("/users/profile", profileRoutes);
app.use("/events", eventRoutes);
app.use("/api", mediaRouter);
