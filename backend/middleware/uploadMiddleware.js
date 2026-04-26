import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lms/profiles",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
    },
});

const eventStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req) => {
        const eventId = req.generatedEventId;

        return {
            folder: `events/${eventId}/thumbnail`,
            allowed_formats: ["jpg", "png", "jpeg", "webp"],
        };
    },
});

const uploadUserProfile = multer({ storage: profileStorage });
const uploadEventThumbnail = multer({ storage: eventStorage });

export { uploadUserProfile, uploadEventThumbnail };
