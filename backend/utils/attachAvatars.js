import { Profile } from "../models/profileModel.js";

const plain = (doc) =>
    doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

/**
 * Hydrate populated user references with their profilePicture from the Profile collection.
 *
 * @param {Object|Array} docs  A mongoose doc, plain object, or array of either.
 * @param {string[]} paths     Paths to populated user refs — supports "field" or "parent.field".
 * @returns Same shape as input, with profilePicture added to each ref.
 */
export const attachAvatars = async (docs, paths) => {
    if (!docs) return docs;
    const isArray = Array.isArray(docs);
    const list = isArray ? docs.map(plain) : [plain(docs)];

    const userIds = new Set();
    for (const doc of list) {
        for (const path of paths) {
            const dot = path.indexOf(".");
            const ref = dot === -1
                ? doc[path]
                : doc[path.slice(0, dot)]?.[path.slice(dot + 1)];
            if (ref?._id) userIds.add(String(ref._id));
        }
    }

    if (userIds.size === 0) return isArray ? list : list[0];

    const profiles = await Profile.find({ user: { $in: [...userIds] } })
        .select("user profilePicture")
        .lean();

    const picMap = new Map(profiles.map((p) => [String(p.user), p.profilePicture || ""]));

    for (const doc of list) {
        for (const path of paths) {
            const dot = path.indexOf(".");
            const ref = dot === -1
                ? doc[path]
                : doc[path.slice(0, dot)]?.[path.slice(dot + 1)];
            if (ref?._id) ref.profilePicture = picMap.get(String(ref._id)) || "";
        }
    }

    return isArray ? list : list[0];
};
