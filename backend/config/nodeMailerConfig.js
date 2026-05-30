/**
 * @module config/nodeMailerConfig
 * @description Builds nodemailer transporters. Exports the default
 * transporter and a builder so {@link module:utils/sendEmail} can retry
 * against alternate SMTP ports on connection failures.
 */

import { createTransport } from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_MAILTRAP_HOST = "sandbox.smtp.mailtrap.io";
const smtpHost =
    process.env.SMTP_HOST || process.env.MAILTRAP_HOST || DEFAULT_MAILTRAP_HOST;
const smtpUser = process.env.SMTP_USER || process.env.MAILTRAP_USER;
const smtpPass = process.env.SMTP_PASS || process.env.MAILTRAP_PASS;

/**
 * Construct a transporter bound to a specific SMTP port. Port 465 uses
 * implicit TLS; other ports negotiate via STARTTLS (`requireTLS`).
 * @param {number} port
 * @returns {import("nodemailer").Transporter}
 */
export const buildNodeMailerTransporter = (port) =>
    createTransport({
        host: smtpHost,
        port,
        secure: port === 465,
        requireTLS: port !== 465,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

const configuredPort =
    Number(process.env.SMTP_PORT) || Number(process.env.MAILTRAP_PORT) || 2525;

/** Default transporter bound to MAILTRAP_PORT (or 2525 fallback). */
const nodeMailerTransporter = buildNodeMailerTransporter(configuredPort);

export default nodeMailerTransporter;
