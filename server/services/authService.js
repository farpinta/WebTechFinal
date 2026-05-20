const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Hashes a plaintext password; cost factor comes from env so it's tunable without code changes.
function hashPassword(plaintext) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
    return bcrypt.hash(plaintext, rounds);
}

// Safely compares a plaintext candidate against a stored bcrypt hash.
function comparePassword(plaintext, hash) {
    return bcrypt.compare(plaintext, hash);
}

// Issues a stateless JWT so downstream routes can verify identity without a DB lookup.
function signToken({ id, email, first_name }) {
    return jwt.sign(
        { id, email, first_name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES || '24h' }
    );
}

// Decodes and verifies a JWT; returns null instead of throwing so callers handle it as a falsy check.
function verifyToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

module.exports = { hashPassword, comparePassword, signToken, verifyToken };
