import cloudinary from "../config/cloudinaryConfig.js";
import Media from "../models/mediaModel.js";
import Interaction from "../models/interactionModel.js";

// Cloudinary's prefix delete cap is 100 assets per call. We page through if
// needed. Resource type matters — videos and images live under separate APIs.
const purgeCloudinaryFolder = async (eventId) => {
    const folder = `events/${eventId}`;
    const summary = { image: 0, video: 0, folderRemoved: false };

    for (const resourceType of ["image", "video"]) {
        let deletedTotal = 0;
        // Loop until the API stops returning items, in case there are >100.
        for (let i = 0; i < 50; i++) {
            try {
                const res = await cloudinary.api.delete_resources_by_prefix(
                    folder,
                    { resource_type: resourceType },
                );
                const count = Object.keys(res?.deleted || {}).length;
                deletedTotal += count;
                if (count === 0) break;
            } catch (err) {
                console.warn(
                    `[cleanup] Cloudinary delete_resources_by_prefix(${folder}, ${resourceType}) failed:`,
                    err.message,
                );
                break;
            }
        }
        summary[resourceType] = deletedTotal;
    }

    // Tear down the now-empty folder structure (thumbnail subfolder + media).
    try {
        await cloudinary.api.delete_folder(`${folder}/thumbnail`);
    } catch {
        // Subfolder may not exist; that's fine.
    }
    try {
        await cloudinary.api.delete_folder(folder);
        summary.folderRemoved = true;
    } catch (err) {
        // Folder may already be gone, or non-empty due to a stuck asset.
        // Not fatal.
        if (err.http_code !== 404) {
            console.warn(
                `[cleanup] Cloudinary delete_folder(${folder}) failed:`,
                err.message,
            );
        }
    }

    return summary;
};

// Worker entrypoint. Deletes everything tied to a previously-removed event:
// Media docs, Interaction docs against those Media, and Cloudinary assets.
//
// Idempotent: if the job runs twice on the same eventId, the second pass
// finds zero of everything and exits cleanly.
export const processEventCleanupJob = async (job) => {
    const { eventId } = job.data;

    // Snapshot media IDs first so we can also delete their interactions.
    const media = await Media.find({ eventId }).select("_id").lean();
    const mediaIds = media.map((m) => m._id);

    const interactionResult = mediaIds.length
        ? await Interaction.deleteMany({ media: { $in: mediaIds } })
        : { deletedCount: 0 };

    const mediaResult = await Media.deleteMany({ eventId });

    const cloudinarySummary = await purgeCloudinaryFolder(eventId);

    return {
        eventId,
        mediaDeleted: mediaResult.deletedCount || 0,
        interactionsDeleted: interactionResult.deletedCount || 0,
        cloudinary: cloudinarySummary,
    };
};
