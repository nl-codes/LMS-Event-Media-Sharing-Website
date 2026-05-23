/**
 * @module config/redisConfig
 * @description Single shared Redis client used by every BullMQ queue.
 * `maxRetriesPerRequest: null` is required by BullMQ — otherwise blocking
 * commands like `blpop` reject prematurely and the worker stream stops.
 */

import IORedis from "ioredis";

let connection = null;

/**
 * Lazy-singleton accessor. Connects on first use; falls back to
 * `redis://127.0.0.1:6379` if `REDIS_URL` is unset.
 * @returns {import("ioredis").Redis}
 */
export const getRedisConnection = () => {
    if (connection) return connection;

    const url = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    connection = new IORedis(url, {
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
    });

    connection.on("error", (err) => {
        console.error("Redis connection error:", err.message);
    });

    return connection;
};

/**
 * Gracefully close the singleton connection. Used in tests and on
 * intentional shutdown.
 * @returns {Promise<void>}
 */
export const closeRedisConnection = async () => {
    if (!connection) return;
    await connection.quit();
    connection = null;
};
