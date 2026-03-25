import nodemailerTransporter, {
    buildNodeMailerTransporter,
} from "../config/nodeMailerConfig.js";

const DEFAULT_PORT = Number(process.env.MAILTRAP_PORT) || 2525;
const FALLBACK_PORTS = [587, 25, 465];

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
