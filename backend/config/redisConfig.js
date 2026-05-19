import IORedis from "ioredis";

// Single shared Redis client for BullMQ. maxRetriesPerRequest must be null per BullMQ requirements; otherwise commands like `blpop` reject prematurely.
let connection = null;

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

export const closeRedisConnection = async () => {
    if (!connection) return;
    await connection.quit();
    connection = null;
};
