/**
 * @module utils/timeline
 * @description Time-window helpers used by event scheduling code.
 */

/**
 * Inclusive "is `now` between these timestamps" check. Accepts Date or
 * string inputs and uses wall-clock `new Date()`.
 * @param {Date|string} startTime
 * @param {Date|string} endTime
 * @returns {boolean}
 */
export const isNowBetween = (startTime, endTime) => {
    const now = new Date();
    return now >= new Date(startTime) && now <= new Date(endTime);
};
