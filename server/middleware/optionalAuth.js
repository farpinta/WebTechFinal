const { verifyToken } = require('../services/authService');

// Optional auth: req.user is set if logged in, null otherwise.
function optionalAuth(req, res, next) {
    const header = req.headers['authorization'];
    if (header && header.startsWith('Bearer ')) {
        const token = header.slice(7);
        const payload = verifyToken(token);
        if (payload) {
            req.user = payload;
        }
    }
    next();
}

module.exports = optionalAuth;
