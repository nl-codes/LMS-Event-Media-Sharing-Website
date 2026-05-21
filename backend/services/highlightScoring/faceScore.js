// Face scoring is currently disabled.
//
// We previously used @vladmandic/face-api with @tensorflow/tfjs-node, but
// tfjs-node 4.22 calls util.isNullOrUndefined which Node 23 removed, so it
// crashes on Node >= 23 (this project is on Node 25). Until tfjs-node ships
// Node 23+ compatibility, this adapter returns a zero score and the rest of
// the highlight pipeline (brightness + CLIP vibe) carries on.
//
// To re-enable: install @vladmandic/face-api + @tensorflow/tfjs-node + canvas
// once tfjs-node is compatible, and restore the lazy-init + detect logic.

let warned = false;

export const scoreFace = async () => {
    if (!warned) {
        warned = true;
        console.warn(
            "[highlight] face scoring is disabled (tfjs-node incompatible with current Node).",
        );
    }
    return { faceScore: 0, faceCount: 0 };
};
