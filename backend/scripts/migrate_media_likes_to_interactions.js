import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../database/connection.js";
import Media from "../models/mediaModel.js";
import Interaction from "../models/interactionModel.js";

dotenv.config();

const toObjectId = (value) => new mongoose.Types.ObjectId(String(value));

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
