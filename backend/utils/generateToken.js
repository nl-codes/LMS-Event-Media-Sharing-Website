import crypto from "crypto";

export const generateResetToken = () => {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = Date.now() + 10 * 60 * 1000; // 10 min
    return { token, tokenHash, expires };
};
