import type { NextConfig } from "next";

const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            new URL(
                `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/**`,
            ),
        ],
    },
};

export default nextConfig;
