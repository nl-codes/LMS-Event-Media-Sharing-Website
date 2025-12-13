import { createTransport } from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const nodeMailerTransporter = createTransport({
    host: process.env.MAILTRAP_HOST,
    port: process.env.MAILTRAP_PORT,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
    },
});

export default nodeMailerTransporter;
