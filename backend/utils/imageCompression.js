/**
 * @module utils/imageCompression
 * @description Server-side WebP recompression on upload. Used by
 * mediaService just before Cloudinary upload to cap outbound bandwidth
 * and Cloudinary storage spend.
 */

import sharp from "sharp";

const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 80;

const isImage = (mimetype) =>
    typeof mimetype === "string" && mimetype.startsWith("image/");

/**
 * Compress an image buffer to WebP @ q=80, fit-inside 1920×1920 (no
 * enlargement). Short-circuits when the source is already WebP and
 * within bounds, returning the original buffer unchanged.
 * @param {Buffer} buffer Raw image bytes from multer.
 * @param {string} mimetype Original mimetype.
 * @returns {Promise<{ buffer: Buffer, mimetype: string, extension: string|null, compressed: boolean }>}
 */
export const compressImageBuffer = async (buffer, mimetype) => {
    if (!isImage(mimetype)) {
        return {
            buffer,
            mimetype,
            extension: null,
            compressed: false,
        };
    }

    const image = sharp(buffer, { failOn: "none" });
    const metadata = await image.metadata();

    const withinBounds =
        (metadata.width ?? 0) <= MAX_DIMENSION &&
        (metadata.height ?? 0) <= MAX_DIMENSION;
    const isWebp = metadata.format === "webp";

    if (isWebp && withinBounds) {
        return {
            buffer,
            mimetype: "image/webp",
            extension: "webp",
            compressed: false,
        };
    }

    const out = await image
        .rotate()
        .resize({
            width: MAX_DIMENSION,
            height: MAX_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

    return {
        buffer: out,
        mimetype: "image/webp",
        extension: "webp",
        compressed: true,
    };
};
