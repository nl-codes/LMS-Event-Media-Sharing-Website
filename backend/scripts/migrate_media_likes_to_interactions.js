/**
 * @module scripts/migrate_media_likes_to_interactions
 * @description One-shot migration: lifts the legacy `Media.likedBy[]`
 * array into individual `Interaction { type: "like" }` rows. Idempotent
 * thanks to the partial unique index on (author, media, type) — re-runs
 * upsert against existing rows instead of duplicating.
 *
 * Bulk-writes in batches of 1000 so a large source collection doesn't
 * blow up worker memory.
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../database/connection.js";
import Media from "../models/mediaModel.js";
import Interaction from "../models/interactionModel.js";

dotenv.config();

/**
 * Coerce a raw id string to a Mongo ObjectId.
 * @param {string|object} value
 * @returns {import("mongoose").Types.ObjectId}
 */
const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

/**
 * Stream every Media with non-empty `likedBy`, emit one Interaction
 * upsert per (author, media), and flush every 1000 ops.
 * @returns {Promise<void>}
 */
const migrateMediaLikesToInteractions = async () => {
    await connectDB();

    const operations = [];
    const cursor = Media.collection.find(
        {
            likedBy: { $exists: true, $type: "array", $ne: [] },
        },
        {
            projection: {
                _id: 1,
                likedBy: 1,
            },
        },
    );

    for await (const media of cursor) {
        const uniqueAuthorIds = [
            ...new Set((media.likedBy || []).filter(Boolean).map(String)),
        ];

        uniqueAuthorIds.forEach((authorId) => {
            operations.push({
                updateOne: {
                    filter: {
                        author: toObjectId(authorId),
                        media: media._id,
                        type: "like",
                    },
                    update: {
                        $setOnInsert: {
                            author: toObjectId(authorId),
                            media: media._id,
                            type: "like",
                            createdAt: new Date(),
                        },
                    },
                    upsert: true,
                },
            });
        });

        if (operations.length >= 1000) {
            await Interaction.bulkWrite(operations, { ordered: false });
            operations.length = 0;
        }
    }

    if (operations.length > 0) {
        await Interaction.bulkWrite(operations, { ordered: false });
    }

    console.log("Media likes migration completed.");
    await mongoose.disconnect();
};

migrateMediaLikesToInteractions().catch(async (error) => {
    console.error("Media likes migration failed:", error);
    await mongoose.disconnect();
    process.exit(1);
});
