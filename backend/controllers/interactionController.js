/**
 * @module controllers/interactionController
 * @description Comments + likes against a media row. Only registered users
 * can interact (guests are uploaders only). Like toggles broadcast a
 * `media_liked` socket event so live gallery viewers see counts update.
 */

import {
    addComment,
    deleteComment,
    editComment,
    getInteractionsByMediaId,
    toggleLike,
} from "../services/interactionService.js";
import { getIO } from "../config/socketConfig.js";

/**
 * Map a service-thrown Error to a meaningful HTTP status by matching
 * substrings in the message. Centralised so every handler returns
 * consistent codes.
 * @param {Error} error
 * @returns {number}
 */
const getStatusCode = (error) => {
    const message = error.message.toLowerCase();
    if (message.includes("not found")) return 404;
    if (message.includes("authorized")) return 403;
    if (message.includes("invalid") || message.includes("required")) {
        return 400;
    }
    return 500;
};

/**
 * GET /interactions/:mediaId?type=comment|like
 *
 * List interactions for a media row, newest first.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const getInteractionsController = async (req, res) => {
    try {
        const type = req.query.type || "comment";
        const interactions = await getInteractionsByMediaId(
            req.params.mediaId,
            type,
        );
        res.status(200).json({ success: true, data: interactions });
    } catch (error) {
        res.status(getStatusCode(error)).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /interactions/comments
 *
 * Persist a comment authored by the caller.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const addCommentController = async (req, res) => {
    try {
        const authorId = req.user?.id;
        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const comment = await addComment({
            content: req.body.content,
            mediaId: req.body.mediaId,
            authorId,
        });

        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        res.status(getStatusCode(error)).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * POST /interactions/likes
 *
 * Toggle the caller's like on a media row. Broadcasts `media_liked` over
 * socket.io to the event's room so any connected client updates its like
 * count without polling.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const toggleLikeController = async (req, res) => {
    try {
        const authorId = req.user?.id;
        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const result = await toggleLike({
            mediaId: req.body.mediaId,
            authorId,
        });

        // Trim the service result to the live-update shape — eventId stays
        // server-side as the socket room key, not echoed back to clients.
        const payload = {
            mediaId: result.mediaId,
            likesCount: result.likesCount,
            userId: result.userId,
            liked: result.liked,
        };

        const io = getIO();
        io.to(result.eventId).emit("media_liked", payload);

        res.status(200).json({ success: true, data: payload });
    } catch (error) {
        res.status(getStatusCode(error)).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * PATCH /interactions/comments/:id
 *
 * Author-self comment edit (the service rejects non-author requesters).
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const editCommentController = async (req, res) => {
    try {
        const authorId = req.user?.id;
        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const comment = await editComment({
            commentId: req.params.id,
            content: req.body.content,
            authorId,
        });

        res.status(200).json({ success: true, data: comment });
    } catch (error) {
        res.status(getStatusCode(error)).json({
            success: false,
            message: error.message,
        });
    }
};

/**
 * DELETE /interactions/comments/:id
 *
 * Author-self comment delete. Admin-driven deletes go through the report
 * verdict pipeline instead.
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @returns {Promise<void>}
 */
export const deleteCommentController = async (req, res) => {
    try {
        const authorId = req.user?.id;
        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const result = await deleteComment({
            commentId: req.params.id,
            authorId,
        });

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(getStatusCode(error)).json({
            success: false,
            message: error.message,
        });
    }
};
