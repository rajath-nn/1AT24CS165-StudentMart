const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./Routes/authroutes");
const profileRoutes = require("./Routes/profileRoutes");

require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.get("/", (req, res) => res.json({ message: "User profile management API is running" }));

app.use((error, req, res, next) => {
    console.error("API error:", error.message);
    if (res.headersSent) return next(error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
});

async function startServer() {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing. Set it in backend/.env.");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    const port = process.env.PORT || 5000;
    app.listen(port, () => console.log("Server running on http://localhost:" + port));
}

startServer().catch(async (error) => {
    console.error("MongoDB connection failed:", error.message);
    await mongoose.disconnect();
    process.exitCode = 1;
});
