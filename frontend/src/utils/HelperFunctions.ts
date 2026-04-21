import { jwtDecode, JwtPayload } from "jwt-decode";
import { User, userJWTToken } from "@/types/User";
import toast from "react-hot-toast";
import type { Media } from "@/types/Media";
import JSZip from "jszip";

export const normalizeLikedByIds = (likedBy: unknown): string[] => {
    if (!Array.isArray(likedBy)) return [];

    return likedBy
        .map((entry) => {
            if (typeof entry === "string") return entry;
            if (
                entry &&
                typeof entry === "object" &&
                "_id" in entry &&
                typeof entry._id === "string"
            ) {
                return entry._id;
            }
            return "";
        })
        .filter(Boolean);
};

export const normalizeMediaLikes = (media: Media): Media => {
    return {
        ...media,
        likedBy: normalizeLikedByIds(media.likedBy),
    };
};

export const isTokenExpired = (token: string): boolean => {
    try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (!decoded.exp) return true;
        const currentTime = Date.now() / 1000;
        return decoded.exp < currentTime;
    } catch (err) {
        console.log("Error in Helper Function (isTokenExpired) : ", err);
        return true;
    }
};

// Helper to extract user info from token
export const getUserFromToken = (token: string): User | null => {
    try {
        const decoded = jwtDecode<userJWTToken>(token);
        if (!decoded.email || !decoded.userName || !decoded.role) return null;
        return {
            _id: decoded.id,
            email: decoded.email,
            userName: decoded.userName,
            role: decoded.role,
        };
    } catch (err) {
        console.log("Error in Helper Function (getUserFromToken) : ", err);
        return null;
    }
};

export const formatToLocalDatetime = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
    return localISOTime;
};

export const handleCopyText = async (textToCopy: string) => {
    try {
        await navigator.clipboard.writeText(textToCopy);
        toast.success("Link copied to clipboard!");
    } catch {
        toast.error("Failed to copy link");
    }
};

export const triggerBrowserDownload = (blob: Blob, filename: string) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(objectUrl);
};

const sanitizeFilename = (value: string) =>
    value
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const inferExtension = (url: string, contentType?: string) => {
    if (contentType?.includes("image/")) {
        return contentType.split("image/")[1] || "jpg";
    }

    if (contentType?.includes("video/")) {
        return contentType.split("video/")[1] || "mp4";
    }

    const urlPath = url.split("?")[0];
    const rawExtension = urlPath.split(".").pop()?.toLowerCase();
    if (!rawExtension) return "bin";

    return rawExtension;
};

export const downloadSingleMedia = async (url: string, filename: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to download media");
    }

    const blob = await response.blob();
    const safeFilename = sanitizeFilename(filename) || `media-${Date.now()}`;
    triggerBrowserDownload(blob, safeFilename);
};

export const downloadAsZip = async (mediaArray: Media[], zipName: string) => {
    if (!mediaArray.length) {
        toast.error("No media available for download");
        return;
    }

    const toastId = toast.loading("Preparing download zip...");

    try {
        const zip = new JSZip();
        const mediaFolder = zip.folder("media");

        if (!mediaFolder) {
            throw new Error("Failed to initialize zip folder");
        }

        await Promise.all(
            mediaArray.map(async (media, index) => {
                const response = await fetch(media.mediaUrl);
                if (!response.ok) {
                    throw new Error(`Failed to fetch media ${index + 1}`);
                }

                const blob = await response.blob();
                const extension = inferExtension(
                    media.mediaUrl,
                    response.headers.get("content-type") || undefined,
                );
                const baseName =
                    sanitizeFilename(media.label || `media-${index + 1}`) ||
                    `media-${index + 1}`;

                mediaFolder.file(`${baseName}-${media._id}.${extension}`, blob);
            }),
        );

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const safeZipName = sanitizeFilename(zipName) || "gallery";
        triggerBrowserDownload(zipBlob, `${safeZipName}.zip`);
        toast.success("Zip ready to download!", { id: toastId });
    } catch (err) {
        const errorMessage =
            err instanceof Error ? err.message : "Failed to generate zip";
        toast.error(errorMessage, { id: toastId });
        throw err;
    }
};
