import {
    addComment,
    deleteComment,
    editComment,
    getInteractionsByMediaId,
    toggleLike,
} from "../services/interactionService.js";
import { getIO } from "../config/socketConfig.js";

const getStatusCode = (error) => {
    const message = error.message.toLowerCase();
    if (message.includes("not found")) return 404;
    if (message.includes("authorized")) return 403;
    if (message.includes("invalid") || message.includes("required")) {
        return 400;
    }
    return 500;
};

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
