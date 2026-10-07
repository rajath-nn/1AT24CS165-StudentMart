const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./Routes/authroutes");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "User authentication API is running"
    });
});

app.use((error, req, res, next) => {
    console.error("API error:", error.message);
    if (res.headersSent) return next(error);
    res.status(500).json({ message: "Something went wrong. Please try again." });
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected");

        const port = process.env.PORT || 5000;
        app.listen(port, () => {
            console.log(
                `Server running on http://localhost:${port}`
            );
        });
    })
    .catch((error) => {
        console.error(
            "MongoDB connection failed:",
            error.message
        );
    });
