import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinaryConfig.js";

const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "lms/profiles",
        allowed_formats: ["jpg", "png", "jpeg"],
    },
});

const uploadUserProfile = multer({ storage: profileStorage });

export { uploadUserProfile };
