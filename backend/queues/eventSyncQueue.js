import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import {
    enqueueHighlightBacklog,
    syncCompletedEvents,
} from "../services/syncManager.js";

export const EVENT_SYNC_QUEUE_NAME = "event-sync";
export const EVENT_SYNC_JOB_NAME = "tick";

const TICK_INTERVAL_MS = 5 * 60 * 1000;

let queue = null;
let worker = null;

export const getEventSyncQueue = () => {
    if (queue) return queue;
    queue = new Queue(EVENT_SYNC_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            // The tick is best-effort; one missed run is harmless because the
            // next one catches up. Keep history short.
            removeOnComplete: { age: 3600, count: 50 },
            removeOnFail: { age: 24 * 3600 },
        },
    });
    return queue;
};

// Run one tick: flip newly-ended events to Completed, then enqueue highlight
// jobs for the paid ones in that set. Both helpers are idempotent.
const runTick = async () => {
    const completed = await syncCompletedEvents();
    const highlights = await enqueueHighlightBacklog();
    return { completed, highlights };
};

export const startEventSyncWorker = async () => {
    if (worker) return worker;

    worker = new Worker(EVENT_SYNC_QUEUE_NAME, runTick, {
        connection: getRedisConnection(),
        concurrency: 1,
    });

    worker.on("failed", (job, err) => {
        console.error(`[event-sync] tick ${job?.id} failed:`, err.message);
    });

    worker.on("completed", (job, result) => {
        const c = result?.completed?.modifiedCount ?? 0;
        const h = result?.highlights?.queued ?? 0;
        if (c > 0 || h > 0) {
            console.log(
                `[event-sync] tick → completed=${c} highlightsQueued=${h}`,
            );
        }
    });

    // Schedule the repeating tick. BullMQ uses jobId-based de-dupe on
    // repeatable jobs, so calling this on every boot is safe — it won't
    // create a second schedule.
    const q = getEventSyncQueue();
    await q.add(
        EVENT_SYNC_JOB_NAME,
        {},
        {
            repeat: { every: TICK_INTERVAL_MS },
            jobId: "event-sync-tick",
        },
    );

    return worker;
};

// One-shot trigger for explicit transitions (e.g. host clicks Complete).
// Fires the same tick logic immediately rather than waiting for the next
// scheduled run.
export const triggerEventSync = async () => {
    const q = getEventSyncQueue();
    return q.add(
        EVENT_SYNC_JOB_NAME,
        {},
        { jobId: `event-sync-once-${Date.now()}` },
    );
};

export const stopEventSyncWorker = async () => {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
};
