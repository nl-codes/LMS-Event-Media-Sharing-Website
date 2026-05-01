#!/usr/bin/env node

/**
 * SuperAdmin Setup Script
 *
 * Usage:
 * node backend/scripts/create_superadmin.js
 *            or
 * npm run setup:superadmin
 *
 * This script creates a SuperAdmin user in the database.
 * It will prompt for email and password securely.
 * Prevents creation of multiple SuperAdmins.
 */

import readline from "readline";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const prompt = (q) => new Promise((r) => rl.question(q, r));

async function createSuperAdmin() {
    try {
        console.log("\n🔐 SuperAdmin Setup Script\n");
        console.log(
            "This script will create a SuperAdmin user in the database.",
        );
        console.log(
            "SuperAdmin has full access to the system and bypasses MFA.\n",
        );

        // Connect to database
        console.log("📡 Connecting to database...");
        const mongoUri = process.env.DB_CONNECTION_STRING;
        if (!mongoUri) {
            throw new Error("DB_CONNECTION_STRING not found in .env file");
        }

        await mongoose.connect(mongoUri);
        console.log("✅ Connected to database\n");

        // Check if SuperAdmin already exists
        console.log("🔍 Checking for existing SuperAdmin...");
        const existingSuperAdmin = await User.findOne({ role: "superadmin" });

        if (existingSuperAdmin) {
            console.log(
                "⚠️  A SuperAdmin already exists:",
                existingSuperAdmin.email,
            );
            const overwrite = await prompt(
                "Do you want to replace it? (yes/no): ",
            );

            if (overwrite.toLowerCase() !== "yes") {
                console.log("❌ Setup cancelled.\n");
                rl.close();
                await mongoose.connection.close();
                process.exit(0);
            }

            console.log(
                "🗑️  Removing existing SuperAdmin:",
                existingSuperAdmin.email,
            );
            await User.deleteOne({ _id: existingSuperAdmin._id });
        }

        // Prompt for email
        console.log("\n📧 Enter SuperAdmin Email:");
        let email = (await prompt("Email: ")).trim().toLowerCase();

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log("❌ Invalid email format.\n");
            rl.close();
            await mongoose.connection.close();
            process.exit(1);
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("❌ A user with this email already exists:", email);
            rl.close();
            await mongoose.connection.close();
            process.exit(1);
        }

        // Prompt for password
        console.log("\n🔑 Enter SuperAdmin Password:");

        let password = await prompt("Password: ");

        if (password.length < 8) {
            console.log("❌ Password must be at least 8 characters long.\n");
            rl.close();
            await mongoose.connection.close();
            process.exit(1);
        }

        let confirmPassword = await prompt("Confirm Password: ");

        if (password !== confirmPassword) {
            console.log("❌ Passwords do not match.\n");
            rl.close();
            await mongoose.connection.close();
            process.exit(1);
        }

        // Prompt for username
        console.log("\n👤 Enter SuperAdmin Username:");
        let userName = (await prompt("Username: ")).trim();

        if (!userName) {
            userName = "SuperAdmin";
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create SuperAdmin user

        const superAdmin = await User.create({
            userName,
            email,
            password: hashedPassword,
            role: "superadmin",
            status: "active",
            adminRequestStatus: "approved",
            adminActionReason: "System SuperAdmin",
            createdAt: new Date(),
        });

        console.log("\n✅ SuperAdmin created successfully!\n");
        console.log("📋 SuperAdmin Details:");
        console.log(`  Email: ${superAdmin.email}`);
        console.log(`  Username: ${superAdmin.userName}`);
        console.log(`  Role: ${superAdmin.role}`);
        console.log(`  Status: ${superAdmin.status}`);
        console.log(`  ID: ${superAdmin._id}`);
        console.log(
            "\n💡 You can now login to the admin panel with this account.\n",
        );

        rl.close();
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error:", error.message, "\n");
        rl.close();
        try {
            await mongoose.connection.close();
        } catch (e) {
            // Ignore cleanup errors
        }
        process.exit(1);
    }
}

createSuperAdmin();
