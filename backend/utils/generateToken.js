/**
 * @module utils/generateToken
 * @description Mint a one-shot token pair for email flows (activation,
 * password reset). The plaintext `token` is what we email; only
 * `tokenHash` is persisted on the User row so a DB leak doesn't yield
 * usable links.
 */

import crypto from "crypto";

/**
 * Generate `{ token, tokenHash, expires }` with a 10-minute lifetime.
 * @returns {{ token: string, tokenHash: string, expires: number }}
 *   `token`        :   the plaintext (emailed to the user).
 *   `tokenHash`    :   sha256 of the plaintext (stored in DB).
 *   `expires`      :   wall-clock ms timestamp.
 */
export const generateGeneralToken = () => {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = Date.now() + 10 * 60 * 1000; // 10 min
    return { token, tokenHash, expires };
};
