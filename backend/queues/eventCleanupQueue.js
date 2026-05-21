import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processEventCleanupJob } from "../services/eventCleanupProcessor.js";

export const EVENT_CLEANUP_QUEUE_NAME = "event-cleanup";

let queue = null;
let worker = null;

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

export const enqueueEventCleanupJob = async (payload) => {
    const q = getEventCleanupQueue();
    // jobId scoped per event so a double-delete in flight de-dupes naturally
    // (BullMQ returns the existing job rather than scheduling a second one).
    return q.add("cleanup-event", payload, {
        jobId: `cleanup_${payload.eventId}`,
    });
};

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
