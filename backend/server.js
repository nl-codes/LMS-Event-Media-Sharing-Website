import express from "express";
import dotenv from "dotenv";
import connectDB from "./database/connection.js";

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

connectDB();
