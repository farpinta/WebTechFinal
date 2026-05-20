const userRepository = require('../repositories/userRepository');
const { hashPassword, comparePassword, signToken } = require('../services/authService');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_RE = /^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

async function register(req, res, next) {
    try {
        const { email, password, first_name } = req.body;

        if (!email || !EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, error: 'Invalid email address', field: 'email' });
        }
        if (!password || !PASSWORD_RE.test(password)) {
            return res.status(400).json({
                success: false,
                error: 'Password must be at least 8 characters and contain a digit and a symbol',
                field: 'password',
            });
        }
        if (!first_name || typeof first_name !== 'string' || first_name.trim().length < 1 || first_name.trim().length > 50) {
            return res.status(400).json({ success: false, error: 'First name must be 1–50 characters', field: 'first_name' });
        }

        const existing = await userRepository.findByEmail(email);
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already registered' });
        }

        const password_hash = await hashPassword(password);
        const user = await userRepository.create({ email, password_hash, first_name: first_name.trim() });
        const token = signToken({ id: user.id, email: user.email, first_name: user.first_name });

        return res.status(201).json({ success: true, token, user: { id: user.id, email: user.email, first_name: user.first_name } });
    } catch (err) {
        next(err);
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Email and password are required' });
        }

        const user = await userRepository.findByEmail(email);
        const valid = user ? await comparePassword(password, user.password_hash) : false;

        if (!valid) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const token = signToken({ id: user.id, email: user.email, first_name: user.first_name });
        return res.json({ success: true, token, user: { id: user.id, first_name: user.first_name } });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login };
