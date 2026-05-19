// Probe duration (seconds) of a local video File via a hidden <video> element.
// Returns null on any decoding failure so the caller can decide whether to
// reject or fall through to server-side enforcement.
export async function probeVideoDuration(file: File): Promise<number | null> {
    if (typeof window === "undefined") return null;

    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";

        const cleanup = () => {
            URL.revokeObjectURL(url);
            video.removeAttribute("src");
            video.load();
        };

        video.onloadedmetadata = () => {
            const seconds = Number.isFinite(video.duration)
                ? video.duration
                : null;
            cleanup();
            resolve(seconds);
        };

        video.onerror = () => {
            cleanup();
            resolve(null);
        };

        video.src = url;
    });
}
