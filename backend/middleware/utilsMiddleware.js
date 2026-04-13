import mongoose from "mongoose";

export const attachEventId = (req, res, next) => {
    req.generatedEventId = new mongoose.Types.ObjectId().toString();
    next();
};
