import React, { useRef, useState } from "react";
import { uploadMedia } from "@/lib/mediaApi";
import toast from "react-hot-toast";

interface MediaUploadButtonProps {
    eventId: string;
    onUploadSuccess: () => void;
}

const MediaUploadButton: React.FC<MediaUploadButtonProps> = ({
    eventId,
    onUploadSuccess,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("eventId", eventId);
        formData.append(
            "mediaType",
            file.type.startsWith("video") ? "video" : "photo",
        );
        try {
            await uploadMedia(eventId, formData);
            onUploadSuccess();
            toast.success("Media uploaded!");
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "Upload failed";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
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
                {loading ? "Uploading..." : "Upload Media"}
            </button>
            <input
                ref={inputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
            />
        </>
    );
};

export default MediaUploadButton;
