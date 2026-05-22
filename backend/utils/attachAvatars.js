/**
 * @module utils/attachAvatars
 * @description Hydrate populated User refs on Mongo docs with the
 * matching Profile.profilePicture in one round-trip. The two-pass shape
 * (collect ids → batch fetch → patch each ref) keeps avatar attachment
 * to a single Mongo query no matter how many docs are passed in.
 */

import { Profile } from "../models/profileModel.js";

/**
 * Coerce a mongoose doc / lean object / plain object to a plain object
 * we can safely mutate.
 * @param {object} doc
 * @returns {object}
 */
const plain = (doc) =>
    doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };

/**
 * Hydrate populated user references with their `profilePicture` from
 * the Profile collection. Supports nested paths via `"parent.field"`.
 *
 * @param {object|object[]} docs A mongoose doc, plain object, or array.
 * @param {string[]} paths Paths to populated user refs "field" or "parent.field".
 * @returns {Promise<object|object[]>} Same shape as input, with `profilePicture`
 *   added to each populated ref. Missing profiles get `""`.
 */
export const attachAvatars = async (docs, paths) => {
    if (!docs) return docs;
    const isArray = Array.isArray(docs);
    const list = isArray ? docs.map(plain) : [plain(docs)];

    const userIds = new Set();
    for (const doc of list) {
        for (const path of paths) {
            const dot = path.indexOf(".");
            const ref =
                dot === -1
                    ? doc[path]
                    : doc[path.slice(0, dot)]?.[path.slice(dot + 1)];
            if (ref?._id) userIds.add(String(ref._id));
        }
    }

    if (userIds.size === 0) return isArray ? list : list[0];

    const profiles = await Profile.find({ user: { $in: [...userIds] } })
        .select("user profilePicture")
        .lean();

    const picMap = new Map(
        profiles.map((p) => [String(p.user), p.profilePicture || ""]),
    );

    for (const doc of list) {
        for (const path of paths) {
            const dot = path.indexOf(".");
            const ref =
                dot === -1
                    ? doc[path]
                    : doc[path.slice(0, dot)]?.[path.slice(dot + 1)];
            if (ref?._id)
                ref.profilePicture = picMap.get(String(ref._id)) || "";
        }
    }

    return isArray ? list : list[0];
};
