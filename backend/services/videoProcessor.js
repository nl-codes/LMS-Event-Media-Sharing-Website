import { execFile } from "child_process";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import cloudinary from "../config/cloudinaryConfig.js";
import Media from "../models/mediaModel.js";
import { Event } from "../models/eventModel.js";
import { getIO } from "../config/socketConfig.js";
import { attachAvatars } from "../utils/attachAvatars.js";

const execFileAsync = promisify(execFile);

// Matches the spec exactly:
//   -vcodec libx264 -crf 25 -r 30 -b:v 3M -vf scale='min(1280,iw)':-2 -movflags +faststart
const buildFfmpegArgs = (inputPath, outputPath) => [
    "-y", // overwrite output if exists
    "-i",
    inputPath,
    "-vcodec",
    "libx264",
    "-crf",
    "25",
    "-r",
    "30",
    "-b:v",
    "3M",
    "-vf",
    "scale='min(1280,iw)':-2",
    "-movflags",
    "+faststart",
    outputPath,
];

const safeUnlink = async (filePath) => {
    if (!filePath) return;
    try {
        await fs.unlink(filePath);
    } catch (err) {
        if (err.code !== "ENOENT") {
            console.warn(`Failed to remove ${filePath}:`, err.message);
        }
    }
};

const uploadToCloudinary = (filePath, eventId) =>
    new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            filePath,
            {
                resource_type: "video",
                folder: `events/${eventId}`,
                format: "mp4",
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            },
        );
    });

// Worker entrypoint. Receives the BullMQ job; on success creates the Media doc
// and emits new_media so the gallery updates without a refresh.
export const processVideoJob = async (job) => {
    const { inputPath, eventId, uploaderId, guestId } = job.data;
    const outputPath = `${inputPath}.processed.mp4`;

    try {
        await execFileAsync(
            ffmpegPath,
            buildFfmpegArgs(inputPath, outputPath),
            {
                // FFmpeg writes its log to stderr even on success; cap the buffer
                // generously so long logs don't crash the worker.
                maxBuffer: 50 * 1024 * 1024,
            },
        );

        const uploadResult = await uploadToCloudinary(outputPath, eventId);

        // Re-read event privacy at completion time so a host toggling privacy while the video was being encoded doesn't leak the wrong visibility.
        const event = await Event.findById(eventId).select("privacy").lean();
        const isPublic = event?.privacy === "public";

        const mediaDoc = await Media.create({
            eventId,
            uploaderId: uploaderId || null,
            guestId: guestId || null,
            mediaUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            mediaType: "video",
            isPublic,
        });

        const populated = await Media.findById(mediaDoc._id)
            .populate("uploaderId", "userName")
            .populate("guestId", "userName guest_id");

        const payload = await attachAvatars({
            ...(populated ? populated.toObject() : mediaDoc.toObject()),
            likesCount: 0,
            likedBy: [],
        }, ["uploaderId"]);

        try {
            const io = getIO();
            io.to(String(eventId)).emit("new_media", payload);
        } catch (emitErr) {
            // Socket failure shouldn't fail the job — the media still exists.
            console.warn("Failed to emit new_media:", emitErr.message);
        }

        return { mediaId: mediaDoc._id, publicId: uploadResult.public_id };
    } finally {
        await Promise.all([safeUnlink(inputPath), safeUnlink(outputPath)]);
    }
};

// Sanity check at boot — if ffmpeg-static didn't resolve a binary we should
// know before the first upload, not when the first job runs.
export const verifyFfmpegAvailable = async () => {
    if (!ffmpegPath) {
        throw new Error("ffmpeg-static did not resolve a binary path");
    }
    await fs.access(ffmpegPath);
    return ffmpegPath;
};

export const __TMP_DIR = path.resolve("uploads/tmp");
