import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
    maxSizeMB: 10,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp" as const,
    initialQuality: 0.8,
};

const swapExtension = (name: string, ext: string) => {
    const dot = name.lastIndexOf(".");
    const base = dot > 0 ? name.slice(0, dot) : name;
    return `${base}.${ext}`;
};

// Compress an image to WebP @ q=0.80, max 1920px on the longest edge.
// Videos and non-image files pass through unchanged. On any error, the original
// file is returned so the backend can take a second pass with sharp.
export async function compressImageIfNeeded(file: File): Promise<File> {
    if (!file.type.startsWith("image/")) return file;

    try {
        const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
        const renamed = new File(
            [compressed],
            swapExtension(file.name, "webp"),
            {
                type: "image/webp",
                lastModified: file.lastModified,
            },
        );
        return renamed;
    } catch {
        return file;
    }
}
