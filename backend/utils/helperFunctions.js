export const extractPublicIdFromUrl = (url) => {
    if (!url || typeof url !== "string") return null;

    try {
        // Regex Explanation:
        // 1. Look for "/v" followed by digits (the version tag)
        // 2. Capture everything after that (the folder path and filename)
        // 3. Stop before the file extension (the last dot)
        const match = url.match(/\/v\d+\/(.+)\.[a-z]+$/i);

        if (match && match[1]) {
            return match[1];
        }

        // Fallback: If no version tag is found, try to get everything after /upload/
        const uploadParts = url.split("/upload/");
        if (uploadParts.length > 1) {
            return uploadParts[1].split(".")[0].replace(/^v\d+\//, "");
        }

        return null;
    } catch (error) {
        console.error("Error extracting Public ID:", error);
        return null;
    }
};
