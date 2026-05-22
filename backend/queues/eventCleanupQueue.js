/**
 * @module queues/eventCleanupQueue
 * @description BullMQ wiring for full-event teardown: runs AFTER the
 * Event row has been deleted to purge Media + Interactions + the
 * Cloudinary folder. Processor: {@link module:services/eventCleanupProcessor}.
 */

import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processEventCleanupJob } from "../services/eventCleanupProcessor.js";

export const EVENT_CLEANUP_QUEUE_NAME = "event-cleanup";

let queue = null;
let worker = null;

/**
 * Lazy-singleton accessor for the cleanup queue.
 * @returns {import("bullmq").Queue}
 */
export const getEventCleanupQueue = () => {
    if (queue) return queue;
    queue = new Queue(EVENT_CLEANUP_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 10_000 },
            removeOnComplete: { age: 24 * 3600, count: 200 },
            removeOnFail: { age: 7 * 24 * 3600 },
        },
    });
    return queue;
};

/**
 * Schedule an event-cleanup job, de-duped per event id (BullMQ returns
 * the existing job rather than scheduling a second one).
 * @param {{ eventId: string }} payload
 * @returns {Promise<import("bullmq").Job>}
 */
export const enqueueEventCleanupJob = async (payload) => {
    const q = getEventCleanupQueue();
    // jobId scoped per event so a double-delete in flight de-dupes naturally
    // (BullMQ returns the existing job rather than scheduling a second one).
    return q.add("cleanup-event", payload, {
        jobId: `cleanup_${payload.eventId}`,
    });
};

/**
 * Boot the worker. Idempotent.
 * @returns {Promise<import("bullmq").Worker>}
 */
export const startEventCleanupWorker = async () => {
    if (worker) return worker;

    worker = new Worker(EVENT_CLEANUP_QUEUE_NAME, processEventCleanupJob, {
        connection: getRedisConnection(),
        concurrency: 2,
    });

    worker.on("failed", (job, err) => {
        console.error(
            `[cleanup] job ${job?.id} failed (event ${job?.data?.eventId}):`,
            err.message,
        );
    });

    worker.on("completed", (job, result) => {
        console.log(
            `[cleanup] job ${job.id} done → event ${result?.eventId}: ${result?.mediaDeleted} media, ${result?.interactionsDeleted} interactions, cloudinary img=${result?.cloudinary?.image} vid=${result?.cloudinary?.video}`,
        );
    });

    return worker;
};

/**
 * Tear down worker + queue.
 * @returns {Promise<void>}
 */
export const stopEventCleanupWorker = async () => {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
};
