import sharp from "sharp";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { randomBytes } from "crypto";

const VIBE_WEIGHT = 50;
const PROMPT_POSITIVE = "A beautiful elegant aesthetic event highlight photo";
const PROMPT_NEGATIVE = "A blurry boring low-quality snapshot";
const CLIP_INPUT_SIZE = 224;

let initPromise = null;
let disabled = false;
let classifier = null;
let RawImage = null;

const initClip = async () => {
    if (disabled) return false;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            const transformers = await import("@xenova/transformers");
            RawImage = transformers.RawImage;
            // First run will download ~150MB of weights into the HF cache. We
            // load the smallest CLIP variant; that's enough for ranking
            // similarity, not classification accuracy.
            classifier = await transformers.pipeline(
                "zero-shot-image-classification",
                "Xenova/clip-vit-base-patch32",
            );
            console.log("[highlight] CLIP ready");
            return true;
        } catch (err) {
            disabled = true;
            console.warn(
                "[highlight] CLIP unavailable, vibe score disabled:",
                err.message,
            );
            return false;
        }
    })();

    return initPromise;
};

// RawImage.read expects a file URL or a path. We resize via Sharp first then
// pass an in-memory tempfile through.
const toRawImage = async (imageBuffer) => {
    const resized = await sharp(imageBuffer)
        .resize(CLIP_INPUT_SIZE, CLIP_INPUT_SIZE, { fit: "cover" })
        .removeAlpha()
        .png()
        .toBuffer();

    const tmp = path.join(os.tmpdir(), `clip-${randomBytes(8).toString("hex")}.png`);
    await fs.writeFile(tmp, resized);
    try {
        return { image: await RawImage.read(tmp), tmp };
    } catch (err) {
        await fs.unlink(tmp).catch(() => {});
        throw err;
    }
};

// Returns { vibeScore, clipSimilarity }. clipSimilarity is the model's
// probability for the positive prompt vs the negative; the score is that
// number multiplied by the configured weight.
export const scoreVibe = async (imageBuffer) => {
    const ready = await initClip();
    if (!ready) return { vibeScore: 0, clipSimilarity: 0 };

    let prepared = null;
    try {
        prepared = await toRawImage(imageBuffer);
        const result = await classifier(prepared.image, [
            PROMPT_POSITIVE,
            PROMPT_NEGATIVE,
        ]);
        // zero-shot-image-classification returns [{label, score}, ...] sorted
        // descending. Find our positive prompt and use its softmax probability.
        const positive = result.find((r) => r.label === PROMPT_POSITIVE);
        const similarity = positive ? positive.score : 0;
        return {
            vibeScore: VIBE_WEIGHT * similarity,
            clipSimilarity: similarity,
        };
    } catch (err) {
        console.warn("[highlight] CLIP inference error:", err.message);
        return { vibeScore: 0, clipSimilarity: 0 };
    } finally {
        if (prepared?.tmp) {
            await fs.unlink(prepared.tmp).catch(() => {});
        }
    }
};
