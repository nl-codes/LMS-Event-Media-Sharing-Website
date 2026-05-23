/**
 * @module utils/sendEmail
 * @description Send transactional mail via the configured nodemailer
 * transporter, with automatic fallback to common SMTP ports when the
 * primary connection is refused or times out.
 */

import nodemailerTransporter, {
    buildNodeMailerTransporter,
} from "../config/nodeMailerConfig.js";

const DEFAULT_PORT = Number(process.env.MAILTRAP_PORT) || 2525;
const FALLBACK_PORTS = [587, 25, 465];

/**
 * True for connection-level errors that warrant a port-fallback retry
 * (timeouts, refused, host unreachable). Auth/parsing errors throw out
 * immediately because retrying with a different port wouldn't help.
 * @param {NodeJS.ErrnoException} error
 * @returns {boolean}
 */
const shouldRetryWithFallback = (error) => {
    const retriableCodes = new Set([
        "ETIMEDOUT",
        "ECONNESET",
        "ECONNREFUSED",
        "EHOSTUNREACH",
        "ENETUNREACH",
        "ESOCKET",
    ]);

    return retriableCodes.has(error?.code);
};

/**
 * Send a transactional email. Tries the configured port first; on
 * retriable connection errors, walks the FALLBACK_PORTS list one by one.
 * @param {string} to
 * @param {string} subject
 * @param {string} text Plaintext body.
 * @param {string} html HTML body.
 * @returns {Promise<void>}
 * @throws {Error} If all attempts fail or the error isn't retriable.
 */
export default async function sendEmail(to, subject, text, html) {
    const mailPayload = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
    };

    try {
        await nodemailerTransporter.sendMail(mailPayload);
        return;
    } catch (error) {
        if (!shouldRetryWithFallback(error)) {
            throw error;
        }

        const portsToTry = FALLBACK_PORTS.filter(
            (port) => port !== DEFAULT_PORT,
        );
        for (const port of portsToTry) {
            try {
                const fallbackTransporter = buildNodeMailerTransporter(port);
                await fallbackTransporter.sendMail(mailPayload);
                return;
            } catch (fallbackError) {
                if (!shouldRetryWithFallback(fallbackError)) {
                    throw fallbackError;
                }
            }
        }

        throw error;
    }
}
