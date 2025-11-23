import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            new URL("https://res.cloudinary.com/dimgh55x6/image/upload/**"),
        ],
    },
};

export default nextConfig;
