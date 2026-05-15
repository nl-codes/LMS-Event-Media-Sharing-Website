import {
    addComment,
    deleteComment,
    editComment,
    getCommentsByMediaId,
} from "../services/interactionService.js";

const getStatusCode = (error) => {
    const message = error.message.toLowerCase();
    if (message.includes("not found")) return 404;
    if (message.includes("authorized")) return 403;
    if (message.includes("invalid") || message.includes("required")) {
        return 400;
    }
    return 500;
};

export const getCommentsController = async (req, res) => {
    try {
        const comments = await getCommentsByMediaId(req.params.mediaId);
        res.status(200).json({ success: true, data: comments });
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
