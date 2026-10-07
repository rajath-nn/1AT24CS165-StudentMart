const crypto = require("crypto");
const { promisify } = require("util");
const express = require("express");
const User = require("../models/user");

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 7;

function validEmail(email) {
    return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function passwordProblem(password) {
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        return "Password must be between 8 and 128 characters.";
    }
    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        return "Use at least one uppercase letter, one lowercase letter, and one number.";
    }
    return null;
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);
    return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
    const [salt, expectedHex] = stored.split(":");
    const expected = Buffer.from(expectedHex, "hex");
    const actual = await scrypt(password, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function tokenSecret() {
    return process.env.AUTH_SECRET || process.env.JWT_SECRET;
}

function signToken(user) {
    const secret = tokenSecret();
    if (!secret || secret.length < 32) {
        throw new Error("AUTH_SECRET must be set to a random value of at least 32 characters.");
    }
    const payload = Buffer.from(JSON.stringify({
        sub: user.id,
        ver: user.tokenVersion,
        exp: Math.floor(Date.now() / 1000) + TOKEN_LIFETIME_SECONDS
    })).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

function publicUser(user) {
    return { id: user.id, name: user.name, email: user.email };
}

function sendSession(res, user, status = 200) {
    return res.status(status).json({ token: signToken(user), user: publicUser(user) });
}

async function authenticate(req, res, next) {
    try {
        const authorization = req.get("authorization") || "";
        const [scheme, token] = authorization.split(" ");
        const secret = tokenSecret();
        if (scheme !== "Bearer" || !token || !secret || secret.length < 32) {
            return res.status(401).json({ message: "Please sign in to continue." });
        }

        const [payload, signature] = token.split(".");
        const expected = crypto.createHmac("sha256", secret).update(payload || "").digest();
        const supplied = Buffer.from(signature || "", "base64url");
        if (supplied.length !== expected.length || !crypto.timingSafeEqual(expected, supplied)) {
            return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
        }

        const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (!claims.sub || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) {
            return res.status(401).json({ message: "Your session has expired. Please sign in again." });
        }
        const user = await User.findById(claims.sub);
        if (!user || user.tokenVersion !== claims.ver) {
            return res.status(401).json({ message: "Your session has ended. Please sign in again." });
        }
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof SyntaxError) {
            return res.status(401).json({ message: "Your session is invalid. Please sign in again." });
        }
        next(error);
    }
}

router.post("/register", async (req, res, next) => {
    try {
        const body = req.body || {};
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const { password } = body;
        const errors = {};

        if (name.length < 2 || name.length > 80) errors.name = "Name must be between 2 and 80 characters.";
        if (!validEmail(email)) errors.email = "Enter a valid email address.";
        const passwordError = passwordProblem(password);
        if (passwordError) errors.password = passwordError;
        if (Object.keys(errors).length) return res.status(400).json({ message: "Please check the form fields.", errors });

        const existing = await User.findOne({ email });
        if (existing) return res.status(409).json({ message: "An account with this email already exists.", errors: { email: "Email is already registered." } });

        const user = await User.create({ name, email, passwordHash: await hashPassword(password) });
        return sendSession(res, user, 201);
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists.", errors: { email: "Email is already registered." } });
        next(error);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const body = req.body || {};
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const { password } = body;
        const errors = {};
        if (!validEmail(email)) errors.email = "Enter a valid email address.";
        if (typeof password !== "string" || password.length === 0 || password.length > 128) errors.password = "Enter your password.";
        if (Object.keys(errors).length) return res.status(400).json({ message: "Please check the form fields.", errors });

        const user = await User.findOne({ email }).select("+passwordHash");
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return res.status(401).json({ message: "Email or password is incorrect." });
        }
        return sendSession(res, user);
    } catch (error) {
        next(error);
    }
});

router.get("/me", authenticate, (req, res) => {
    res.json({ user: publicUser(req.user) });
});

router.post("/logout", authenticate, async (req, res, next) => {
    try {
        await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
        res.json({ message: "You have been signed out." });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
