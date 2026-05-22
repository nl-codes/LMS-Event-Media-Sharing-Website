import mongoose from "mongoose";
import Interaction from "../models/interactionModel.js";
import Media from "../models/mediaModel.js";
import { attachAvatars } from "../utils/attachAvatars.js";

/**
 * @module services/interactionService
 * @description Comments + likes against Media. Like uniqueness is enforced
 * by the DB-level partial unique index; {@link toggleLike} wraps in a
 * transaction with a standalone-Mongo fallback.
 */

const validateObjectId = (id, label) => {
    if (!mongoose.isValidObjectId(id)) {
        throw new Error(`Invalid ${label}`);
    }
};

/**
 * Persist a comment against a media row.
 * @param {{ content: string, authorId: string, mediaId: string }} input
 * @returns {Promise<object>} Saved comment with author populated.
 * @throws {Error} On invalid ids, empty content, or missing media.
 */
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

    const populated = await Interaction.findById(comment._id).populate(
        "author",
        "userName",
    );
    return attachAvatars(populated, ["author"]);
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

/**
 * Atomic like/unlike toggle. Uses a Mongo transaction; falls back to a
 * non-transactional path on standalone deployments.
 * @param {{ mediaId: string, authorId: string }} input
 * @returns {Promise<{ mediaId: string, eventId: string, userId: string, liked: boolean, likesCount: number }>}
 * @throws {Error} On invalid ids or missing media.
 */
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

/**
 * List interactions for a media row, newest first.
 * @param {string} mediaId
 * @param {"comment"|"like"} [type="comment"]
 * @returns {Promise<object[]>}
 * @throws {Error} On invalid id, invalid type, or missing media.
 */
export const getInteractionsByMediaId = async (mediaId, type = "comment") => {
    validateObjectId(mediaId, "media id");

    if (!["comment", "like"].includes(type)) {
        throw new Error("Invalid interaction type");
    }

    const media = await Media.findById(mediaId).select("_id");
    if (!media) {
        throw new Error("Media not found");
    }

    const interactions = await Interaction.find({ media: mediaId, type })
        .sort({ createdAt: -1 })
        .populate("author", "userName");
    return attachAvatars(interactions, ["author"]);
};

/**
 * Author-self edit of a comment's content.
 * @param {{ commentId: string, authorId: string, content: string }} input
 * @returns {Promise<object>} Updated comment with author populated.
 * @throws {Error} On missing comment, empty content, or non-author requester.
 */
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

    const populated = await Interaction.findById(comment._id).populate(
        "author",
        "userName",
    );
    return attachAvatars(populated, ["author"]);
};

/**
 * Author-self delete of a comment. Admin-driven deletes use
 * {@link module:services/reportService}.
 * @param {{ commentId: string, authorId: string }} input
 * @returns {Promise<{ deletedId: string }>}
 * @throws {Error} On missing comment or non-author requester.
 */
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
