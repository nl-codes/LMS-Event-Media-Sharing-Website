/**
 * @module queues/mediaRetentionQueue
 * @description BullMQ wiring for tier-based media-retention cleanup
 * (delete an event's media + cloudinary assets while keeping the Event
 * row). Processor: {@link module:services/mediaRetentionProcessor}.
 */

import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processMediaRetentionJob } from "../services/mediaRetentionProcessor.js";
import { markRetentionStatus } from "../services/mediaRetentionService.js";

export const MEDIA_RETENTION_QUEUE_NAME = "event-media-retention-cleanup";

let queue = null;
let worker = null;

/**
 * Lazy-singleton accessor for the retention queue.
 * @returns {import("bullmq").Queue}
 */
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

/**
 * Schedule a retention cleanup job for one event. `delayMs` is used to
 * register the job ahead of the deletion deadline (BullMQ delayed job)
 * for newly-created events; the startup/periodic scanner enqueues with
 * no delay for events already past their retention.
 *
 * Notably does NOT use a per-event jobId — BullMQ keeps completed jobs
 * around for `removeOnComplete.age`, so a stable jobId would cause every
 * re-enqueue to silently de-dup against the old job. The processor
 * short-circuits on `mediaDeletionStatus === "completed"`, so duplicate
 * work is already prevented at the application layer.
 *
 * @param {{ eventId: string }} payload
 * @param {{ delayMs?: number }} [opts]
 * @returns {Promise<import("bullmq").Job>}
 */
export const enqueueMediaRetentionJob = async (payload, { delayMs } = {}) => {
    const q = getMediaRetentionQueue();
    const opts = {};
    if (typeof delayMs === "number" && delayMs > 0) {
        opts.delay = delayMs;
    }
    // Add to Redis first so we never leave the event stuck in `queued`
    // status with no actual job behind it (which would block the scanner
    // from picking it up again on the next tick).
    const job = await q.add("delete-event-media", payload, opts);
    try {
        await markRetentionStatus(payload.eventId, "queued");
    } catch (err) {
        console.warn(
            `[media-retention] failed to mark queued for ${payload.eventId}:`,
            err.message,
        );
    }
    return job;
};

/**
 * Boot the worker. Idempotent.
 * @returns {Promise<import("bullmq").Worker>}
 */
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

/**
 * Tear down worker + queue.
 * @returns {Promise<void>}
 */
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
