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

const toggleLikeOperation = async ({ authorId, mediaId, session = null }) => {
    const media = await Media.findById(mediaId)
        .select("_id eventId")
        .session(session);

    if (!media) {
        throw new Error("Media not found");
    }

    const existingLike = await Interaction.findOne({
        author: authorId,
        media: mediaId,
        type: "like",
    }).session(session);

    let liked;
    if (existingLike) {
        await Interaction.deleteOne({ _id: existingLike._id }).session(session);
        liked = false;
    } else {
        await Interaction.create(
            [
                {
                    type: "like",
                    author: authorId,
                    media: mediaId,
                },
            ],
            { session },
        );
        liked = true;
    }

    const likesCount = await Interaction.countDocuments({
        media: mediaId,
        type: "like",
    }).session(session);

    return {
        mediaId: String(media._id),
        eventId: String(media.eventId),
        userId: String(authorId),
        liked,
        likesCount,
    };
};

export const toggleLike = async ({ mediaId, authorId }) => {
    validateObjectId(authorId, "author id");
    validateObjectId(mediaId, "media id");

    const session = await mongoose.startSession();

    try {
        let result;
        await session.withTransaction(async () => {
            result = await toggleLikeOperation({ authorId, mediaId, session });
        });
        return result;
    } catch (error) {
        const transactionUnsupported =
            error.message.includes("Transaction numbers") ||
            error.message.includes("replica set member");

        if (!transactionUnsupported) {
            throw error;
        }

        return toggleLikeOperation({ authorId, mediaId });
    } finally {
        await session.endSession();
    }
};

export const getInteractionsByMediaId = async (mediaId, type = "comment") => {
    validateObjectId(mediaId, "media id");

    if (!["comment", "like"].includes(type)) {
        throw new Error("Invalid interaction type");
    }

    const media = await Media.findById(mediaId).select("_id");
    if (!media) {
        throw new Error("Media not found");
    }

    return Interaction.find({ media: mediaId, type })
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
