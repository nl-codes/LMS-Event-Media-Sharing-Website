import sendEmail from "../utils/sendEmail.js";

/**
 * BullMQ processor for transactional email jobs.
 * @param {import("bullmq").Job<{ to: string, subject: string, text: string, html: string }>} job
 * @returns {Promise<{ to: string, subject: string }>}
 */
export const processEmailJob = async (job) => {
    const { to, subject, text, html } = job.data || {};

    if (!to || !subject || !text || !html) {
        throw new Error("Email job is missing required fields");
    }

    await sendEmail(to, subject, text, html);

    return { to, subject };
};
