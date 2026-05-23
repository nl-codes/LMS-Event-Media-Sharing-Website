/**
 * @module queues/eventPrivacyQueue
 * @description BullMQ wiring for the event-privacy cascade when a host
 * toggles Event.privacy, this queue fans the new `isPublic` value out to
 * every Media row. Processor: {@link module:services/eventPrivacyProcessor}.
 */

import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processEventPrivacyJob } from "../services/eventPrivacyProcessor.js";

export const EVENT_PRIVACY_QUEUE_NAME = "event-privacy-update";

// Lazy-init singletons so importing this module is cheap and Redis only
// connects on first real use.
let queue = null;
let worker = null;

/**
 * Lazy-singleton accessor for the privacy queue.
 * @returns {import("bullmq").Queue}
 */
export const getEventPrivacyQueue = () => {
    if (queue) return queue;
    queue = new Queue(EVENT_PRIVACY_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
            removeOnComplete: { age: 3600, count: 100 },
            removeOnFail: { age: 24 * 3600 },
        },
    });
    return queue;
};

/**
 * Schedule a privacy-cascade job.
 * @param {{ eventId: string, privacy: "public"|"private", targetIsPublic: boolean }} payload
 * @returns {Promise<import("bullmq").Job>}
 */
export const enqueueEventPrivacyJob = async (payload) => {
    const q = getEventPrivacyQueue();
    return q.add("update-privacy", payload);
};

/**
 * Boot the worker. Idempotent re-calling returns the existing worker.
 * @returns {Promise<import("bullmq").Worker>}
 */
export const startEventPrivacyWorker = async () => {
    if (worker) return worker;

    worker = new Worker(EVENT_PRIVACY_QUEUE_NAME, processEventPrivacyJob, {
        connection: getRedisConnection(),
        concurrency: 2,
    });

    worker.on("failed", (job, err) => {
        console.error(
            `Privacy job ${job?.id} failed (event ${job?.data?.eventId}):`,
            err.message,
        );
    });

    worker.on("completed", (job, result) => {
        if (result?.skipped) {
            console.log(
                `Privacy job ${job.id} skipped (event ${result.eventId}): ${result.reason}`,
            );
        } else {
            console.log(
                `Privacy job ${job.id} done → event ${result?.eventId}, modified ${result?.modifiedCount}/${result?.matchedCount}`,
            );
        }
    });

    return worker;
};

/**
 * Tear down worker + queue. Used in tests; not normally called at runtime.
 * @returns {Promise<void>}
 */
export const stopEventPrivacyWorker = async () => {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
};
