import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processVideoJob, verifyFfmpegAvailable } from "../services/videoProcessor.js";

export const VIDEO_QUEUE_NAME = "video-processing";

let queue = null;
let worker = null;

export const getVideoQueue = () => {
    if (queue) return queue;
    queue = new Queue(VIDEO_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: "exponential", delay: 5000 },
            removeOnComplete: { age: 3600, count: 100 },
            removeOnFail: { age: 24 * 3600 },
        },
    });
    return queue;
};

export const enqueueVideoJob = async (payload) => {
    const q = getVideoQueue();
    return q.add("process-video", payload);
};

export const startVideoWorker = async () => {
    if (worker) return worker;

    // Fail fast at boot if the bundled ffmpeg binary is missing.
    await verifyFfmpegAvailable();

    worker = new Worker(VIDEO_QUEUE_NAME, processVideoJob, {
        connection: getRedisConnection(),
        // Concurrency=1 keeps FFmpeg from pinning the dev machine.
        concurrency: 1,
    });

    worker.on("failed", (job, err) => {
        console.error(
            `Video job ${job?.id} failed (event ${job?.data?.eventId}):`,
            err.message,
        );
    });

    worker.on("completed", (job, result) => {
        console.log(
            `Video job ${job.id} completed → media ${result?.mediaId}`,
        );
    });

    return worker;
};

export const stopVideoWorker = async () => {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
};
