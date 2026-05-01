import mongoose from "mongoose";

export const attachEventId = (req, res, next) => {
    const { id } = req.params;
    console.log(id);
    req.generatedEventId = id ?? new mongoose.Types.ObjectId().toString();
    next();
};
