import nodemailerTransporter from "../config/nodeMailerConfig.js";

export default async function sendEmail(to, subject, text, html) {
    await nodemailerTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
    });
}
