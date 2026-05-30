/**
 * @module queues/eventSyncQueue
 * @description Recurring 5-minute reconciliation tick. Each tick flips
 * newly-ended events to Completed, enqueues highlight jobs for paid-ended
 * events, and enqueues retention cleanup jobs for events past their
 * deletion deadline.
 *
 * Also exposes {@link triggerEventSync} so transitions like "host
 * manually finished an event" can fire an immediate tick without waiting
 * for the scheduler.
 */

import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import {
    enqueueHighlightBacklog,
    enqueueMediaRetentionBacklog,
    syncCompletedEvents,
} from "../services/syncManager.js";

export const EVENT_SYNC_QUEUE_NAME = "event-sync";
export const EVENT_SYNC_JOB_NAME = "tick";

/** Repeatable-job key used by upsertJobScheduler kept stable so we can
 *  evict legacy keys on startup. */
export const EVENT_SYNC_SCHEDULER_ID = "event-sync-tick";

const TICK_INTERVAL_MS = 5 * 60 * 1000;

let queue = null;
let worker = null;

/**
 * Lazy-singleton accessor for the event-sync queue.
 * @returns {import("bullmq").Queue}
 */
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
// jobs for the paid ones in that set, then sweep for media-retention
// deletions that have come due. All helpers are idempotent.
const runTick = async () => {
    const completed = await syncCompletedEvents();
    const highlights = await enqueueHighlightBacklog();
    const retention = await enqueueMediaRetentionBacklog();
    return { completed, highlights, retention };
};

/**
 * Boot the worker and (re)register the recurring scheduler. Also evicts
 * any legacy repeatable-job entries left over from earlier scheduler ids.
 * @returns {Promise<import("bullmq").Worker>}
 */
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
        const n = result?.completed?.notifiedCount ?? 0;
        const h = result?.highlights?.queued ?? 0;
        const r = result?.retention?.queued ?? 0;
        if (c > 0 || n > 0 || h > 0 || r > 0) {
            console.log(
                `[event-sync] tick → completed=${c} eventEndNotifications=${n} highlightsQueued=${h} retentionQueued=${r}`,
            );
        }
    });

    const q = getEventSyncQueue();
    await q.upsertJobScheduler(
        EVENT_SYNC_SCHEDULER_ID,
        { every: TICK_INTERVAL_MS },
        {
            name: EVENT_SYNC_JOB_NAME,
            data: {},
        },
    );

    try {
        const legacyKeys = await q.getRepeatableJobs();
        await Promise.all(
            legacyKeys
                .filter((k) => k.id !== EVENT_SYNC_SCHEDULER_ID)
                .map((k) => q.removeRepeatableByKey(k.key)),
        );
    } catch (err) {
        console.warn(
            "[event-sync] legacy repeatable cleanup failed:",
            err.message,
        );
    }

    return worker;
};

/**
 * One-shot tick trigger for explicit transitions (e.g. the host clicks
 * Finish Event). Schedules the same tick handler so callers don't have
 * to wait for the 5-minute interval.
 * @returns {Promise<import("bullmq").Job>}
 */
export const triggerEventSync = async () => {
    const q = getEventSyncQueue();
    return q.add(
        EVENT_SYNC_JOB_NAME,
        {},
        { jobId: `event-sync-once-${Date.now()}` },
    );
};

/**
 * Tear down worker + queue.
 * @returns {Promise<void>}
 */
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
