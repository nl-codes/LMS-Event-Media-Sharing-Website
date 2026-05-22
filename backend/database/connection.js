/**
 * @module database/connection
 * @description Single-shot mongoose connector. Exits the process on
 * failure so the server can't accept traffic against a half-initialised
 * Mongo client.
 */

import mongoose from "mongoose";

/**
 * Connect to MongoDB using `DB_CONNECTION_STRING`. Exits with code 1 on
 * failure — the caller never has to handle a rejected promise.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING);
        console.log("✅ MongoDB connected.");
    } catch (error) {
        console.log("❌ DB connection error ", error);
        process.exit(1);
    }
};

export default connectDB;
