/**
 * @module server
 * @description Express + socket.io entrypoint.
 *  Boot order matters:
 *  1. Webhook router is mounted BEFORE `express.json()` so Stripe can verify the raw body signature.
 *  2. JSON parser, cookie parser, and CORS gate the rest of the stack.
 *  3. socket.io is wired with the same FRONTEND_URL origin and stashed in {@link module:config/socketConfig} for services to use.
 *  4. Routes mount last (all REST routers).
 *  5. `startServer` connects to Mongo, runs the startup-sync reconciliation, then spawns every BullMQ worker, each worker boot is wrapped in try/catch so a single missing dep doesn't take the whole API down.
 */

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
import superAdminRoutes from "./routes/superAdminRoute.js";
import interactionRoutes from "./routes/interactionRoute.js";
import reportRoutes from "./routes/reportRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import appealRoutes from "./routes/appealRoute.js";
import { runStartupSync } from "./services/syncManager.js";
import { startVideoWorker } from "./queues/videoQueue.js";
import { startEventPrivacyWorker } from "./queues/eventPrivacyQueue.js";
import { startHighlightWorker } from "./queues/highlightQueue.js";
import { startEventCleanupWorker } from "./queues/eventCleanupQueue.js";
import { startEventSyncWorker } from "./queues/eventSyncQueue.js";
import { startMediaRetentionWorker } from "./queues/mediaRetentionQueue.js";
import { startEmailWorker } from "./queues/emailQueue.js";

import { setIO } from "./config/socketConfig.js";
import {
    findPopulatedMessage,
    saveChatMessage,
} from "./services/chatService.js";
import { markChatAsRead } from "./services/eventMembershipService.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Stripe webhooks require the raw body for signature verification.
app.use("/webhooks", webhookRoutes);

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
    process.env.FRONTEND_URL || "https://www.lms.narayanlohani.com.np",
];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    }),
);

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});

setIO(io);

/**
 * Socket.io Connection Handler
 * Manages real-time connections, chat, and gallery events
 */
io.on("connection", (socket) => {
    // Chat rooms get a prefixed name so they don't collide with the
    // gallery rooms (which use the raw eventId as their key).
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

            const populatedMessage = (await findPopulatedMessage(
                savedMessage._id,
            )) || {
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

// Health check — used by Render and uptime monitors
app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
});

app.use("/users", userRoutes);
app.use("/users/profile", profileRoutes);
app.use("/events", eventRoutes);
app.use("/media", mediaRouter);
app.use("/event-memberships", eventMembershipRoutes);
app.use("/chats", chatRoutes);
app.use("/payments", paymentRoutes);
app.use("/admins", adminRoutes);
app.use("/superadmins", superAdminRoutes);
app.use("/interactions", interactionRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);
app.use("/appeals", appealRoutes);

const port = process.env.PORT;

/**
 * Boot Mongo → run startup reconciliation → spawn each BullMQ worker
 * (failures logged and isolated so one bad dep doesn't take the API
 * down) → start listening.
 * @returns {Promise<void>}
 */
const startServer = async () => {
    await connectDB();
    await runStartupSync();

    try {
        await startEmailWorker();
        console.log("✉️  Email worker started");
    } catch (err) {
        // Non-fatal: routes can still serve, but email-dependent flows will
        // fail to enqueue until Redis/worker configuration is fixed.
        console.error("Failed to start email worker:", err.message);
    }

    try {
        await startVideoWorker();
        console.log("🎬 Video processing worker started");
    } catch (err) {
        // Non-fatal: API can still serve everything except video uploads. Operators see this in logs; video uploads will 503 until Redis/ffmpeg are healthy.
        console.error("Failed to start video worker:", err.message);
    }

    try {
        await startEventPrivacyWorker();
        console.log("🔒 Event privacy worker started");
    } catch (err) {
        console.error("Failed to start event privacy worker:", err.message);
    }

    if (process.env.DISABLE_HIGHLIGHT_WORKER === "true") {
        console.log(
            "✨ Highlight worker disabled by DISABLE_HIGHLIGHT_WORKER env flag",
        );
    } else {
        try {
            await startHighlightWorker();
            console.log("✨ Highlight worker started");
        } catch (err) {
            // Non-fatal: API stays online, paid events queue but won't process
            // until the worker (and its AI deps) come up.
            console.error("Failed to start highlight worker:", err.message);
        }
    }

    try {
        await startEventCleanupWorker();
        console.log("🧹 Event cleanup worker started");
    } catch (err) {
        // Non-fatal: deletions still succeed at the Event level, cleanup
        // queues up and runs once the worker recovers.
        console.error("Failed to start event cleanup worker:", err.message);
    }

    try {
        await startEventSyncWorker();
        console.log("⏰ Event sync scheduler started (every 5 min)");
    } catch (err) {
        // Non-fatal: events still flip to Completed on next server restart
        // via runStartupSync; the scheduler is the live-detection path.
        console.error("Failed to start event sync scheduler:", err.message);
    }

    try {
        await startMediaRetentionWorker();
        console.log("🗑️  Media retention worker started");
    } catch (err) {
        // Non-fatal: deletion still happens once the worker recovers and
        // the startup/periodic scanner re-enqueues outstanding events.
        console.error("Failed to start media retention worker:", err.message);
    }

    server.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
    });
};

startServer().catch((error) => {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
});
