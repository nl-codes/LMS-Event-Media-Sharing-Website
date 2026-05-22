/**
 * @module services/highlightScoring/faceScore
 * @description DISABLED face scorer (tfjs-node not yet Node 23+ compatible).
 * Returns zero so the rest of the highlight pipeline keeps running.
 * Re-enable: install @vladmandic/face-api + @tensorflow/tfjs-node + canvas
 * and restore the lazy-init + detect logic.
 */

let warned = false;

/**
 * Stub face scorer (disabled). Always returns a zero score.
 * @returns {Promise<{ faceScore: 0, faceCount: 0 }>}
 */
export const scoreFace = async () => {
    if (!warned) {
        warned = true;
        console.warn(
            "[highlight] face scoring is disabled (tfjs-node incompatible with current Node).",
        );
    }
    return { faceScore: 0, faceCount: 0 };
};
