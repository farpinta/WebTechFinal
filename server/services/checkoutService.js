// ===================================================================
// server/services/checkoutService.js
// Business logic: re-validates prices server-side (Gatekeeper Pattern,
// ARCHITECTURE.md "Security Decisions") then delegates to the booking
// repository. Controllers never call the repository directly.
// ===================================================================
const workshopRepo = require('../repositories/workshopRepository');
const bookingRepo  = require('../repositories/bookingRepository');

/**
 * Validates server-side prices and creates an atomic booking.
 *
 * @param {object}       opts
 * @param {number|null}  opts.userId      null for guest checkout
 * @param {string}       opts.email
 * @param {string}       opts.card_last4
 * @param {Array<{workshop_id:number, quantity:number}>} opts.cartItems
 *
 * @returns {Promise<
 *   { ok: true,  order_id: string } |
 *   { ok: false, conflict: { workshop_id: number, title: string } }
 * >}
 * @throws {{ status: 404, message: string }} when a workshop_id is unknown
 */
async function processCheckout({ userId, email, card_last4, cartItems }) {
    // -- Server-side price validation (Gatekeeper) ------------------
    // Client-supplied unit_price is IGNORED here. We always use the
    // DB price so a crafted request cannot book at an arbitrary price.
    const validatedItems = [];

    for (const item of cartItems) {
        const workshop = await workshopRepo.findById(item.workshop_id);
        if (!workshop) {
            const err = new Error(`Workshop ${item.workshop_id} not found`);
            err.status = 404;
            throw err;
        }
        validatedItems.push({
            workshop_id: workshop.id,
            quantity:    item.quantity,
            unit_price:  workshop.price_current,   // authoritative server price
        });
    }

    const total     = validatedItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const order_id  = `ORD-${Date.now()}`;
    const placed_at = new Date().toISOString();

    return bookingRepo.createBooking({
        order_id,
        user_id:   userId,
        email,
        card_last4,
        total,
        placed_at,
        items: validatedItems,
    });
}

module.exports = { processCheckout };