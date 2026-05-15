import mongoose from "mongoose";
import Interaction from "../models/interactionModel.js";
import Media from "../models/mediaModel.js";

const validateObjectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error(`Invalid ${label}`);
    }
};

export const addComment = async ({ content, authorId, mediaId }) => {
    validateObjectId(authorId, "authorId");
    validateObjectId(mediaId, "mediaId");

    const trimmedContent = content?.trim();
    if (!trimmedContent) {
        throw new Error("Comment content is required");
    }

    const media = await Media.findById(mediaId).select("_id");
    if (!media) {
        throw new Error("Media not found");
    }

    const comment = await Interaction.create({
        type: "comment",
        content: trimmedContent,
        author: authorId,
        media: mediaId,
    });

    return Interaction.findById(comment._id).populate("author", "userName");
};

export const getCommentsByMediaId = async (mediaId) => {
    validateObjectId(mediaId, "media id");

    const media = await Media.findById(mediaId).select("_id");
    if (!media) {
        throw new Error("Media not found");
    }

    return Interaction.find({ media: mediaId, type: "comment" })
        .sort({ createdAt: -1 })
        .populate("author", "userName");
};

export const editComment = async ({ commentId, authorId, content }) => {
    validateObjectId(commentId, "comment id");
    validateObjectId(authorId, "author id");

    const trimmedContent = content?.trim();
    if (!trimmedContent) {
        throw new Error("Comment content is required");
    }

    const comment = await Interaction.findById(commentId);
    if (!comment) {
        throw new Error("Comment not found");
    }

    if (String(comment.author) !== String(authorId)) {
        throw new Error("Not authorized to edit this comment");
    }

    comment.content = trimmedContent;
    await comment.save();

    return Interaction.findById(comment._id).populate("author", "userName");
};

export const deleteComment = async ({ commentId, authorId }) => {
    validateObjectId(commentId, "comment id");
    validateObjectId(authorId, "author id");

    const comment = await Interaction.findById(commentId);
    if (!comment) {
        throw new Error("Comment not found");
    }

    if (String(comment.author) !== String(authorId)) {
        throw new Error("Not authorized to delete this comment");
    }

    await comment.deleteOne();
    return { deletedId: commentId };
};
