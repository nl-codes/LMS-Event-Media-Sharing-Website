import React, { useRef, useState } from "react";
import { uploadMedia } from "@/lib/mediaApi";
import toast from "react-hot-toast";

interface MediaUploadButtonProps {
    eventId: string;
    eventSlug?: string;
    onUploadSuccess: () => void;
}

const MediaUploadButton: React.FC<MediaUploadButtonProps> = ({
    eventId,
    eventSlug,
    onUploadSuccess,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [uploadCount, setUploadCount] = useState(0);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (files.length > 10) {
            toast.error("You can upload up to 10 files at once.");
            if (inputRef.current) inputRef.current.value = "";
            return;
        }

        setLoading(true);
        setUploadCount(files.length);

        const formData = new FormData();
        Array.from(files).forEach((file) => {
            formData.append("files", file);
        });
        formData.append("eventId", eventId);

        try {
            await toast.promise(uploadMedia(formData, eventSlug), {
                loading: `Uploading ${files.length} files...`,
                success: `${files.length} file${files.length > 1 ? "s" : ""} uploaded!`,
                error: (err) =>
                    err instanceof Error ? err.message : "Upload failed",
            });
            onUploadSuccess();
        } catch {
            // Error toast handled by toast.promise
        } finally {
            setLoading(false);
            setUploadCount(0);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <>
            <button
                type="button"
                className="bg-cusblue text-cuscream px-4 py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50 font-medium"
                onClick={() => inputRef.current?.click()}
                disabled={loading}>
                {loading
                    ? `Uploading ${uploadCount} file${uploadCount > 1 ? "s" : ""}...`
                    : "Upload Media"}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
            />
        </>
    );
};

export default MediaUploadButton;
