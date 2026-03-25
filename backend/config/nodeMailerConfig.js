import { createTransport } from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const DEFAULT_MAILTRAP_HOST = "sandbox.smtp.mailtrap.io";

export const buildNodeMailerTransporter = (port) =>
    createTransport({
        host: process.env.MAILTRAP_HOST || DEFAULT_MAILTRAP_HOST,
        port,
        secure: port === 465,
        requireTLS: port !== 465,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
    });

const configuredPort = Number(process.env.MAILTRAP_PORT) || 2525;
const nodeMailerTransporter = buildNodeMailerTransporter(configuredPort);

export default nodeMailerTransporter;
