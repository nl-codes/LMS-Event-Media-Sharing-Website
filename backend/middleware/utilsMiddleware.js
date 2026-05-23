/**
 * @module middleware/utilsMiddleware
 * @description Small request-shaping helpers used across routes.
 */

import mongoose from "mongoose";

/**
 * Reserve a Mongo ObjectId on `req.generatedEventId`. Either echoes the
 * `:id` route param (edit flow) or mints a fresh one (create flow).
 *
 * Must run BEFORE any Cloudinary thumbnail upload so the storage path
 * `events/<id>/thumbnail/...` can be constructed before the file lands.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export const attachEventId = (req, res, next) => {
    const { id } = req.params;
    req.generatedEventId = id ?? new mongoose.Types.ObjectId().toString();
    next();
};
