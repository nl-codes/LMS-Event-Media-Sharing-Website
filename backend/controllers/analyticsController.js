import {
    getUserGrowth,
    getEventGrowth,
    getMediaGrowth,
} from "../services/analyticsService.js";

const makeHandler = (loader) => async (req, res) => {
    try {
        const { range } = req.query;
        const result = await loader(range);
        res.status(200).json({ success: true, ...result });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || "Failed to load analytics",
        });
    }
};

export const getUserGrowthController = makeHandler(getUserGrowth);
export const getEventGrowthController = makeHandler(getEventGrowth);
export const getMediaGrowthController = makeHandler(getMediaGrowth);
