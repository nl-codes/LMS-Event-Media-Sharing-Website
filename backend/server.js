import express from "express";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import connectDB from "./database/connection.js";
import userRoutes from "./routes/userRoute.js";
import profileRoutes from "./routes/profileRoute.js";
import eventRoutes from "./routes/eventRoute.js";
import mediaRouter from "./routes/mediaRoute.js";
import { setIO } from "./config/socketConfig.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    }),
);

const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:8080",
        methods: ["GET", "POST"],
    },
});

setIO(io);

io.on("connection", (socket) => {
    socket.on("join_gallery", (eventId) => {
        socket.join(eventId);
    });

    socket.on("leave_gallery", (eventId) => {
        socket.leave(eventId);
    });

    socket.on("disconnect", () => {});
});

const port = process.env.PORT;

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

connectDB();

app.use("/users", userRoutes);
app.use("/users/profile", profileRoutes);
app.use("/events", eventRoutes);
app.use("/api", mediaRouter);
