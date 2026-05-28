const checkoutService = require('../services/checkoutService');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CARD_RE  = /^\d{16}$/;

async function placeOrder(req, res, next) {
    try {
        const { items, email, card } = req.body;

        if (!Array.isArray(items) || items.length < 1) {
            return res.status(400).json({ success: false, error: 'items must be a non-empty array', field: 'items' });
        }
        for (const entry of items) {
            if (!Number.isInteger(entry.id) || !Number.isInteger(entry.quantity) || entry.quantity < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Each item must have an integer id and a positive integer quantity',
                    field: 'items',
                });
            }
        }
        if (!email || !EMAIL_RE.test(email)) {
            return res.status(400).json({ success: false, error: 'Invalid email address', field: 'email' });
        }
        if (!card || !CARD_RE.test(card)) {
            return res.status(400).json({ success: false, error: 'Card must be exactly 16 digits', field: 'card' });
        }

        const user_id = req.user ? req.user.id : null;
        const result = await checkoutService.placeOrder({ items, email, card, user_id });
        return res.status(201).json({ success: true, data: result });
    } catch (err) {
        if (err.message.startsWith('WORKSHOP_FULL:')) {
            const workshopId = parseInt(err.message.split(':')[1], 10);
            return res.status(409).json({ success: false, error: 'Workshop full', workshopId });
        }
        if (err.message.startsWith('WORKSHOP_NOT_FOUND:')) {
            const workshopId = parseInt(err.message.split(':')[1], 10);
            return res.status(404).json({ success: false, error: 'Workshop not found', workshopId });
        }
        next(err);
    }
}

module.exports = { placeOrder };
