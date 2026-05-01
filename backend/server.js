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
import eventMembershipRoutes from "./routes/eventMembershipRoute.js";
import chatRoutes from "./routes/chatRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import webhookRoutes from "./routes/webhookRoutes.js";
import adminRoutes from "./routes/adminRoute.js";

import { setIO } from "./config/socketConfig.js";
import { saveChatMessage } from "./services/chatService.js";
import { markChatAsRead } from "./services/eventMembershipService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Stripe webhooks require the raw body for signature verification.
app.use("/webhooks", webhookRoutes);

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

/**
 * Socket.io Connection Handler
 * Manages real-time connections, chat, and gallery events
 */
io.on("connection", (socket) => {
    const getChatRoomName = (eventId) => `chat_${eventId}`;

    // Gallery events (existing functionality)
    socket.on("join_gallery", (eventId) => {
        socket.join(eventId);
    });

    socket.on("leave_gallery", (eventId) => {
        socket.leave(eventId);
    });

    /**
     * Chat Events
     * send_message: Receives a message from a client, saves it to DB, and broadcasts to the room
     */
    socket.on("send_message", async (data) => {
        try {
            const { eventId, senderId, senderName, senderEmail, text } = data;

            // Validate required fields
            if (!eventId || !senderId || !text) {
                socket.emit("message_error", {
                    error: "Missing required fields: eventId, senderId, and text",
                });
                return;
            }

            // Only registered users can send messages
            // Guests must have a senderId (registered userId)
            if (!senderId || senderId === "guest") {
                socket.emit("message_error", {
                    error: "Only registered users can send messages",
                });
                return;
            }

            // Save message to database
            const savedMessage = await saveChatMessage(
                eventId,
                senderId,
                senderName || "Anonymous",
                senderEmail || "unknown@email.com",
                text,
            );

            // Populate sender info for broadcast
            const populatedMessage = {
                _id: savedMessage._id,
                eventId: savedMessage.eventId,
                senderId: savedMessage.senderId,
                senderName: savedMessage.senderName,
                senderEmail: savedMessage.senderEmail,
                text: savedMessage.text,
                createdAt: savedMessage.createdAt,
            };

            // Broadcast message to all users in the event room
            io.to(getChatRoomName(eventId)).emit(
                "receive_message",
                populatedMessage,
            );
        } catch (error) {
            console.error("❌ Error sending message:", error);
            socket.emit("message_error", {
                error: error.message || "Failed to send message",
            });
        }
    });

    /**
     * join_chat_room: User joins a chat room for an event
     */
    socket.on("join_chat_room", (eventId) => {
        if (eventId) {
            socket.join(getChatRoomName(eventId));
        }
    });

    /**
     * leave_chat_room: User leaves a chat room
     */
    socket.on("leave_chat_room", (eventId) => {
        if (eventId) {
            socket.leave(getChatRoomName(eventId));
        }
    });

    socket.on("disconnect", () => {
        // Cleanup if needed
    });

    // Mark chat as read via socket (client may emit when user opens the chat)
    socket.on("mark_as_read", async (data) => {
        try {
            const { eventId, userId, time } = data || {};
            if (!eventId || !userId) return;
            await markChatAsRead(
                eventId,
                userId,
                time ? new Date(time) : new Date(),
            );
        } catch (err) {
            console.error("❌ Error marking chat as read via socket:", err);
        }
    });
});

const port = process.env.PORT;

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

connectDB();

app.use("/users", userRoutes);
app.use("/users/profile", profileRoutes);
app.use("/events", eventRoutes);
app.use("/media", mediaRouter);
app.use("/event-memberships", eventMembershipRoutes);
app.use("/chats", chatRoutes);
app.use("/payments", paymentRoutes);
app.use("/admins", adminRoutes);
