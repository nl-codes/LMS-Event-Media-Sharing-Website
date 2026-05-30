/**
 * @module queues/emailQueue
 * @description BullMQ wiring for transactional emails. SMTP can be slow on
 * production providers, so request handlers enqueue mail and return without
 * waiting for Gmail/Mailtrap delivery.
 */

import { Queue, Worker } from "bullmq";
import { getRedisConnection } from "../config/redisConfig.js";
import { processEmailJob } from "../services/emailProcessor.js";

export const EMAIL_QUEUE_NAME = "transactional-email";

let queue = null;
let worker = null;

export const getEmailQueue = () => {
    if (queue) return queue;

    queue = new Queue(EMAIL_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 10000 },
            removeOnComplete: { age: 3600, count: 200 },
            removeOnFail: { age: 24 * 3600 },
        },
    });

    return queue;
};

/**
 * Enqueue a transactional email.
 * @param {{ to: string, subject: string, text: string, html: string }} payload
 * @returns {Promise<import("bullmq").Job>}
 */
export const enqueueEmailJob = async (payload) => {
    const q = getEmailQueue();
    return q.add("send-email", payload);
};

export const startEmailWorker = async () => {
    if (worker) return worker;

    worker = new Worker(EMAIL_QUEUE_NAME, processEmailJob, {
        connection: getRedisConnection(),
        concurrency: 3,
    });

    worker.on("failed", (job, err) => {
        console.error(
            `Email job ${job?.id} failed (${job?.data?.to || "unknown"}):`,
            err.message,
        );
    });

    worker.on("completed", (job, result) => {
        console.log(`Email job ${job.id} sent → ${result?.to}`);
    });

    return worker;
};

export const stopEmailWorker = async () => {
    if (worker) {
        await worker.close();
        worker = null;
    }
    if (queue) {
        await queue.close();
        queue = null;
    }
};
