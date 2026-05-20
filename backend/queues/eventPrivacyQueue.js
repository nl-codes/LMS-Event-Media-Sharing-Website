import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processEventPrivacyJob } from "../services/eventPrivacyProcessor.js";

export const EVENT_PRIVACY_QUEUE_NAME = "event-privacy-update";

let queue = null;
let worker = null;

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

export const enqueueEventPrivacyJob = async (payload) => {
    const q = getEventPrivacyQueue();
    return q.add("update-privacy", payload);
};

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
