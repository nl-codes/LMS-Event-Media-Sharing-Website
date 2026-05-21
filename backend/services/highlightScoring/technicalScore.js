import sharp from "sharp";

// Scoring weights kept here so the rest of the pipeline doesn't have magic numbers scattered around.
const BRIGHTNESS_WEIGHT = 20;
const BRIGHTNESS_MIN_PCT = 40;
const BRIGHTNESS_MAX_PCT = 80;

// Lightweight brightness analysis on a small grayscale thumbnail. Returns
// { brightnessPercent, brightnessScore } so the scorer can report both the
// raw signal and the contribution to the total score.
//
export const scoreTechnical = async (imageBuffer) => {
    try {
        const { data, info } = await sharp(imageBuffer)
            .resize(64, 64, { fit: "inside" })
            .greyscale()
            .raw()
            .toBuffer({ resolveWithObject: true });

        if (!data.length) {
            return { brightnessPercent: 0, brightnessScore: 0 };
        }

        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const meanLuma = sum / data.length;
        const brightnessPercent = (meanLuma / 255) * 100;

        const brightnessScore =
            brightnessPercent >= BRIGHTNESS_MIN_PCT &&
            brightnessPercent <= BRIGHTNESS_MAX_PCT
                ? BRIGHTNESS_WEIGHT
                : 0;

        // info kept in scope for potential future signals (channels, etc).
        void info;

        return { brightnessPercent, brightnessScore };
    } catch (err) {
        console.warn("[highlight] technical scoring failed:", err.message);
        return { brightnessPercent: 0, brightnessScore: 0 };
    }
};
