import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_CONNECTION_STRING);
        console.log("✅ MongoDB connected.");
    } catch (error) {
        console.log("❌ DB connection error ", error);
        process.exit(1);
    }
};

export default connectDB;
