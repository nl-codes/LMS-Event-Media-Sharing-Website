/**
 * @module queues/videoQueue
 * @description BullMQ wiring for ffmpeg-based video transcode +
 * Cloudinary upload. Processor: {@link module:services/videoProcessor}.
 * Worker boot verifies the bundled ffmpeg binary exists before starting.
 */

import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import {
    processVideoJob,
    verifyFfmpegAvailable,
} from "../services/videoProcessor.js";

export const VIDEO_QUEUE_NAME = "video-processing";

let queue = null;
let worker = null;

/**
 * Lazy-singleton accessor for the video queue.
 * @returns {import("bullmq").Queue}
 */
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

/**
 * Schedule a video-encode job. The caller must have already spilled the
 * input video to `payload.inputPath`.
 * @param {{ inputPath: string, eventId: string, uploaderId?: string, guestId?: string, originalName?: string }} payload
 * @returns {Promise<import("bullmq").Job>}
 */
export const enqueueVideoJob = async (payload) => {
    const q = getVideoQueue();
    return q.add("process-video", payload);
};

/**
 * Boot the worker. Fails fast at startup if the ffmpeg binary is missing,
 * so missing-dep failures surface at boot rather than on first upload.
 * @returns {Promise<import("bullmq").Worker>}
 */
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
        console.log(`Video job ${job.id} completed → media ${result?.mediaId}`);
    });

    return worker;
};

/**
 * Tear down worker + queue. Used in tests; not normally called at runtime.
 * @returns {Promise<void>}
 */
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
