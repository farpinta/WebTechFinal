// ===================================================================
// server/middleware/authenticate.js — JWT gate for protected routes
//
// Reads the Authorization: Bearer <token> header, verifies with
// authService.verifyToken(), and attaches the decoded payload to
// req.user so downstream controllers never touch the token directly.
//
// Returns 401 if the header is absent, malformed, or the token is
// expired / has an invalid signature.
// ===================================================================
const { verifyToken } = require('../services/authService');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7).trim()
        : null;

    if (!token) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const payload = verifyToken(token);   // returns null on any failure
    if (!payload) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    req.user = payload;   // { id, email, first_name, iat, exp }
    next();
}

module.exports = authenticate;