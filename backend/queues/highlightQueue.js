import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processHighlightJob } from "../services/highlightProcessor.js";

export const HIGHLIGHT_QUEUE_NAME = "event-highlight-generation";

let queue = null;
let worker = null;

export const getHighlightQueue = () => {
    if (queue) return queue;
    queue = new Queue(HIGHLIGHT_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: "exponential", delay: 30_000 },
            removeOnComplete: { age: 7 * 24 * 3600, count: 200 },
            removeOnFail: { age: 30 * 24 * 3600 },
        },
    });
    return queue;
};

export const enqueueHighlightJob = async (payload) => {
    const q = getHighlightQueue();
    // Job ID set to the eventId so duplicate enqueues for the same event
    // de-dupe at the BullMQ layer (returns existing job rather than creating
    // a second one). BullMQ reserves `:` as a key separator, so use `_`.
    return q.add("generate-highlights", payload, {
        jobId: `highlight_${payload.eventId}`,
    });
};

export const startHighlightWorker = async () => {
    if (worker) return worker;

    // Concurrency 1 because each job already parallelizes image scoring
    // internally and the models are heavy.
    //
    // lockDuration is raised well above the 30s default: CLIP inference on
    // onnxruntime-node holds the main thread in ~500ms bursts, which on a
    // busy event can starve the worker heartbeat past the default stall
    // threshold. 5 minutes is more than enough for any realistic event.
    //
    // maxStalledCount=1 means a job that DOES legitimately stall is retried
    // once and then fails — better than infinite recycling of a stuck event.
    worker = new Worker(HIGHLIGHT_QUEUE_NAME, processHighlightJob, {
        connection: getRedisConnection(),
        concurrency: 1,
        lockDuration: 5 * 60 * 1000,
        maxStalledCount: 1,
    });

    worker.on("failed", (job, err) => {
        console.error(
            `[highlight] job ${job?.id} failed (event ${job?.data?.eventId}):`,
            err.message,
        );
    });

    worker.on("completed", (job, result) => {
        if (result?.skipped) {
            console.log(
                `[highlight] job ${job.id} skipped: ${result.reason}`,
            );
        } else {
            console.log(
                `[highlight] job ${job.id} done → event ${result?.eventId}, selected ${result?.selectedCount}/${result?.totalImages}`,
            );
        }
    });

    return worker;
};

export const stopHighlightWorker = async () => {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
};
