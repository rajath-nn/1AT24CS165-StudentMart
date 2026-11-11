const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: 2,
            maxlength: 80
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254
        },
        phone: {
            type: String,
            trim: true,
            maxlength: 32,
            default: ""
        },
        age: {
            type: Number,
            min: 1,
            max: 120,
            default: null
        },
        gender: {
            type: String,
            enum: ["", "Female", "Male", "Non-binary", "Other", "Prefer not to say"],
            default: ""
        },
        passwordHash: {
            type: String,
            required: true,
            select: false
        },
        tokenVersion: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
