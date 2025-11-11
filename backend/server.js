import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./database/connection.js";
import userRoutes from "./routes/userRoute.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

connectDB();

app.use("/users", userRoutes);
