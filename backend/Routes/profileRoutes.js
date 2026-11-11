const crypto = require("crypto");
const { promisify } = require("util");
const express = require("express");
const User = require("../models/user");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;
const GENDERS = ["Female", "Male", "Non-binary", "Other", "Prefer not to say"];
const publicUser = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    age: user.age ?? null,
    gender: user.gender || ""
});

function parseAge(value) {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value === "number" && Number.isInteger(value)) return value;
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
    return NaN;
}

function passwordProblem(password) {
    if (typeof password !== "string" || password.length < 8 || password.length > 128) return "Password must be 8 to 128 characters.";
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) return "Use uppercase, lowercase, and a number.";
    return null;
}
async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);
    return salt + ":" + hash.toString("hex");
}
async function verifyPassword(password, stored) {
    if (typeof stored !== "string") return false;
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const expected = Buffer.from(hash, "hex");
    const actual = await scrypt(password, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
function signToken(user) {
    const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
    const payload = Buffer.from(JSON.stringify({ sub: user.id, ver: user.tokenVersion, exp: Math.floor(Date.now() / 1000) + 604800 })).toString("base64url");
    return payload + "." + crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

router.use(authMiddleware);
router.get("/", (req, res) => res.json({ user: publicUser(req.user) }));

router.put("/", async (req, res, next) => {
    try {
        const body = req.body || {};
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const phone = body.phone === undefined
            ? req.user.phone || ""
            : typeof body.phone === "string" ? body.phone.trim() : null;
        const age = body.age === undefined ? req.user.age ?? null : parseAge(body.age);
        const gender = body.gender === undefined
            ? req.user.gender || ""
            : typeof body.gender === "string" ? body.gender : null;
        const errors = {};
        if (name.length < 2 || name.length > 80) errors.name = "Name must be between 2 and 80 characters.";
        if (email.length > 254 || !EMAIL_PATTERN.test(email)) errors.email = "Enter a valid email address.";
        if (phone === null || (phone && (phone.length > 32 || !PHONE_PATTERN.test(phone) || phone.replace(/\D/g, "").length < 7 || phone.replace(/\D/g, "").length > 15))) {
            errors.phone = "Enter a valid phone number with 7 to 15 digits.";
        }
        if (Number.isNaN(age) || (age !== null && (!Number.isInteger(age) || age < 1 || age > 120))) errors.age = "Age must be between 1 and 120.";
        if (gender === null || (gender && !GENDERS.includes(gender))) errors.gender = "Choose a valid gender option.";
        if (Object.keys(errors).length) return res.status(400).json({ message: "Please check the form fields.", errors });
        if (await User.findOne({ email, _id: { $ne: req.user._id } })) {
            return res.status(409).json({ message: "Email is already in use.", errors: { email: "Choose another email address." } });
        }
        req.user.name = name;
        req.user.email = email;
        req.user.phone = phone;
        req.user.age = age;
        req.user.gender = gender;
        await req.user.save();
        return res.json({ message: "Profile updated.", user: publicUser(req.user) });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "Email is already in use.", errors: { email: "Choose another email address." } });
        return next(error);
    }
});

router.put("/change-password", async (req, res, next) => {
    try {
        const body = req.body || {};
        if (typeof body.currentPassword !== "string" || !body.currentPassword) return res.status(400).json({ message: "Enter your current password." });
        const passwordError = passwordProblem(body.newPassword);
        if (passwordError) return res.status(400).json({ message: passwordError });
        const user = await User.findById(req.user._id).select("+passwordHash");
        if (!user || !(await verifyPassword(body.currentPassword, user.passwordHash))) return res.status(400).json({ message: "Current password is incorrect." });
        if (body.currentPassword === body.newPassword) return res.status(400).json({ message: "Choose a different new password." });
        user.passwordHash = await hashPassword(body.newPassword);
        user.tokenVersion += 1;
        await user.save();
        return res.json({ message: "Password changed successfully.", token: signToken(user), user: publicUser(user) });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
