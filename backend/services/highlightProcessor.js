import {
    applyHighlightSelection,
    checkEventEligibility,
    loadEventImageMedia,
    pickHighlightCount,
    setHighlightStatus,
} from "./highlightService.js";
import { scoreTechnical } from "./highlightScoring/technicalScore.js";
import { scoreFace } from "./highlightScoring/faceScore.js";
import { scoreVibe } from "./highlightScoring/vibeScore.js";

/**
 * @module services/highlightProcessor
 * @description BullMQ worker that scores an event's images (technical +
 * face + vibe), selects the top N, and writes the highlight selection.
 * Concurrency 1; failed images are sentinel-scored so they sort last.
 */

// CPU-bound scorers; keep this small. Each "slot" downloads + Sharps + runs
// CLIP inference, which is heavy on its own. Concurrency 1 is intentional:
// two simultaneous CLIP forward passes on onnxruntime-node contend for the
// same CPU and starve the BullMQ heartbeat past its stall threshold without
// actually delivering more throughput.
const IMAGE_CONCURRENCY = 1;

// Tiny semaphore so we don't pull in p-limit for one usage.
const withConcurrency = async (items, limit, worker) => {
    const results = new Array(items.length);
    let cursor = 0;
    const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
        (async () => {
            while (cursor < items.length) {
                const i = cursor++;
                results[i] = await worker(items[i], i);
            }
        })(),
    );
    await Promise.all(runners);
    return results;
};

const FETCH_TIMEOUT_MS = 15000;

const downloadImage = async (url) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const arr = await res.arrayBuffer();
        return Buffer.from(arr);
    } finally {
        clearTimeout(t);
    }
};

const scoreOne = async (media) => {
    try {
        const buffer = await downloadImage(media.mediaUrl);
        const [technical, face, vibe] = await Promise.all([
            scoreTechnical(buffer),
            scoreFace(buffer),
            scoreVibe(buffer),
        ]);
        const totalScore =
            technical.brightnessScore + face.faceScore + vibe.vibeScore;
        return {
            mediaId: String(media._id),
            totalScore,
            ...technical,
            ...face,
            ...vibe,
            failed: false,
        };
    } catch (err) {
        // One bad image must not poison the batch. Assign sentinel-low score
        // so it sorts last and never gets picked.
        console.warn(
            `[highlight] scoring failed for ${media._id}:`,
            err.message,
        );
        return {
            mediaId: String(media._id),
            totalScore: -Infinity,
            failed: true,
        };
    }
};

/**
 * Worker entrypoint. Returns a summary surfaced in the completed-job log.
 * @param {import("bullmq").Job<{ eventId: string }>} job
 * @returns {Promise<{ eventId: string, skipped?: boolean, reason?: string, tier?: string, totalImages?: number, scoredCount?: number, selectedCount?: number, topScore?: number, allFailed?: boolean }>}
 */
export const processHighlightJob = async (job) => {
    const { eventId } = job.data;

    const { eligible, reason, event } = await checkEventEligibility(eventId);
    if (!eligible) {
        console.log(`[highlight] skipping event ${eventId}: ${reason}`);
        return { eventId, skipped: true, reason };
    }

    await setHighlightStatus(eventId, "processing");

    try {
        const images = await loadEventImageMedia(eventId);

        if (images.length === 0) {
            await applyHighlightSelection(eventId, []);
            await setHighlightStatus(eventId, "completed");
            return {
                eventId,
                tier: event.tier,
                totalImages: 0,
                selectedCount: 0,
            };
        }

        const scored = await withConcurrency(
            images,
            IMAGE_CONCURRENCY,
            scoreOne,
        );

        const scorable = scored.filter((s) => !s.failed);
        if (scorable.length === 0) {
            console.warn(
                `[highlight] all images failed scoring for event ${eventId}`,
            );
            await setHighlightStatus(eventId, "failed");
            return {
                eventId,
                tier: event.tier,
                totalImages: images.length,
                selectedCount: 0,
                allFailed: true,
            };
        }

        scorable.sort((a, b) => b.totalScore - a.totalScore);
        const highlightCount = pickHighlightCount(scorable.length);
        const selected = scorable.slice(0, highlightCount);
        const selectedIds = selected.map((s) => s.mediaId);

        await applyHighlightSelection(eventId, selectedIds);
        await setHighlightStatus(eventId, "completed");

        return {
            eventId,
            tier: event.tier,
            totalImages: images.length,
            scoredCount: scorable.length,
            selectedCount: selectedIds.length,
            topScore: selected[0]?.totalScore ?? 0,
        };
    } catch (err) {
        console.error(
            `[highlight] job failed for event ${eventId}:`,
            err.message,
        );
        await setHighlightStatus(eventId, "failed").catch(() => {});
        throw err;
    }
};
