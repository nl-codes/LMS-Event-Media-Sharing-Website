/**
 * @module config/cloudinaryConfig
 * @description Configures and exports the shared Cloudinary v2 client.
 * Loaded once at module init so every upload / destroy call hits the
 * same configured account.
 */

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
