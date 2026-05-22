// ===================================================================
// server/controllers/checkoutController.js
// POST /api/checkout — protected by authenticate middleware (JWT).
//
// HTTP contract:
//   201 Created    → booking succeeded, returns order_id
//   400 Bad Request → invalid request body
//   401 Unauthorized → missing / expired JWT (handled by middleware)
//   404 Not Found   → unknown workshop_id in items
//   409 Conflict   → at least one workshop is full; returns workshop_id
//                    and title so the client can highlight the item
// ===================================================================
const checkoutService = require('../services/checkoutService');

// card_last4 must be exactly 4 decimal digits
const CARD_LAST4_RE = /^\d{4}$/;

async function checkout(req, res, next) {
    try {
        const { email, card_last4, items } = req.body;

        // ── Input validation ────────────────────────────────────────
        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false, error: 'email is required', field: 'email',
            });
        }
        if (!card_last4 || !CARD_LAST4_RE.test(String(card_last4))) {
            return res.status(400).json({
                success: false, error: 'card_last4 must be exactly 4 digits', field: 'card_last4',
            });
        }
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false, error: 'items must be a non-empty array', field: 'items',
            });
        }
        for (const item of items) {
            if (!Number.isInteger(item.workshop_id) || item.workshop_id < 1) {
                return res.status(400).json({
                    success: false, error: 'Each item must have a valid integer workshop_id',
                });
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return res.status(400).json({
                    success: false, error: 'Each item quantity must be an integer ≥ 1',
                });
            }
        }

        // ── Delegate to service ────────────────────────────────────
        // req.user is attached by the authenticate middleware.
        const result = await checkoutService.processCheckout({
            userId:    req.user?.id ?? null,
            email,
            card_last4: String(card_last4),
            cartItems: items,
        });

        // ── Map result to HTTP status ──────────────────────────────
        if (!result.ok) {
            // 409 Conflict — workshop full
            return res.status(409).json({
                success:     false,
                error:       'Workshop full',
                workshop_id: result.conflict.workshop_id,
                title:       result.conflict.title,
            });
        }

        // 201 Created — booking succeeded
        return res.status(201).json({
            success:  true,
            order_id: result.order_id,
        });

    } catch (err) {
        if (err.status === 404) {
            return res.status(404).json({ success: false, error: err.message });
        }
        next(err);   // global error handler sends 500
    }
}

module.exports = { checkout };