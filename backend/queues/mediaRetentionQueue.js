import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processMediaRetentionJob } from "../services/mediaRetentionProcessor.js";
import { markRetentionStatus } from "../services/mediaRetentionService.js";

export const MEDIA_RETENTION_QUEUE_NAME = "event-media-retention-cleanup";

let queue = null;
let worker = null;

export const getMediaRetentionQueue = () => {
    if (queue) return queue;
    queue = new Queue(MEDIA_RETENTION_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 30_000 },
            // Keep finished records around a bit for debuggability, but
            // failed ones longer so on-call can inspect them.
            removeOnComplete: { age: 7 * 24 * 3600, count: 200 },
            removeOnFail: { age: 30 * 24 * 3600 },
        },
    });
    return queue;
};

// Schedule a single retention job for an event. `delayMs` lets callers
// register the job ahead of the deletion deadline (BullMQ delayed jobs)
// while the startup scanner enqueues with delay 0 for events already past
// their retention.
export const enqueueMediaRetentionJob = async (payload, { delayMs } = {}) => {
    const q = getMediaRetentionQueue();
    // Per-event jobId so a double-enqueue de-dupes naturally.
    const opts = { jobId: `media_retention_${payload.eventId}` };
    if (typeof delayMs === "number" && delayMs > 0) {
        opts.delay = delayMs;
    }
    try {
        await markRetentionStatus(payload.eventId, "queued");
    } catch (err) {
        console.warn(
            `[media-retention] failed to mark queued for ${payload.eventId}:`,
            err.message,
        );
    }
    return q.add("delete-event-media", payload, opts);
};

export const startMediaRetentionWorker = async () => {
    if (worker) return worker;

    worker = new Worker(MEDIA_RETENTION_QUEUE_NAME, processMediaRetentionJob, {
        connection: getRedisConnection(),
        concurrency: 2,
    });

    worker.on("failed", (job, err) => {
        console.error(
            `[media-retention] job ${job?.id} failed (event ${job?.data?.eventId}):`,
            err.message,
        );
    });

    worker.on("completed", (job, result) => {
        if (result?.skipped) {
            console.log(
                `[media-retention] job ${job.id} skipped: ${result.reason}`,
            );
            return;
        }
        console.log(
            `[media-retention] job ${job.id} done → event ${result?.eventId}: ${result?.mediaDeleted} media, ${result?.interactionsDeleted} interactions, cloudinary img=${result?.cloudinary?.image} vid=${result?.cloudinary?.video}`,
        );
    });

    return worker;
};

export const stopMediaRetentionWorker = async () => {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
};
