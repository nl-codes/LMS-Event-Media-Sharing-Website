import sharp from "sharp";

const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 80;

const isImage = (mimetype) =>
    typeof mimetype === "string" && mimetype.startsWith("image/");

// Compress an image buffer to WebP @ 80, fit-inside 1920x1920 (no enlargement).
// If the source is already WebP and within bounds, returns the original buffer.
// Returns { buffer, mimetype, extension, compressed } so the caller can decide
// how to label the file before sending to Cloudinary.
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
