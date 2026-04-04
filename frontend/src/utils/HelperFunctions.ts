import { jwtDecode, JwtPayload } from "jwt-decode";
import { User, userJWTToken } from "@/types/User";
import toast from "react-hot-toast";

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

export const downloadSingleMedia = async (url: string, filename: string) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to download media");
    }

    const blob = await response.blob();
    const safeFilename = sanitizeFilename(filename) || `media-${Date.now()}`;
    triggerBrowserDownload(blob, safeFilename);
};
