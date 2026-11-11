const crypto = require("crypto");
const User = require("../models/user");

function readToken(token) {
    const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
    const supplied = Buffer.from(parts[1], "base64url");
    if (supplied.length !== expected.length || !crypto.timingSafeEqual(expected, supplied)) return null;
    try {
        const claims = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
        return typeof claims.sub === "string" && Number.isFinite(claims.exp) && claims.exp > Date.now() / 1000 ? claims : null;
    } catch {
        return null;
    }
}

async function authMiddleware(req, res, next) {
    try {
        const match = (req.get("authorization") || "").match(/^Bearer\s+(\S+)$/i);
        const claims = match ? readToken(match[1]) : null;
        if (!claims) return res.status(401).json({ message: "Your session is invalid or has expired. Please sign in again." });
        const user = await User.findById(claims.sub);
        if (!user || user.tokenVersion !== claims.ver) return res.status(401).json({ message: "Your session has ended. Please sign in again." });
        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = authMiddleware;
