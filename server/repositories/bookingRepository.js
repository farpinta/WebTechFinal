// ===================================================================
// server/repositories/bookingRepository.js
// Single responsibility: persist one complete order atomically.
//
// Bonus A — Concurrency Safety (ARCHITECTURE.md, "Stock-Check"):
//   BEGIN IMMEDIATE acquires a RESERVED write-lock BEFORE reading
//   capacity, so two simultaneous "last seat" requests are serialised
//   by SQLite itself. Only one can win; the other always sees the
//   updated current_bookings and returns { ok: false, conflict }.
// ===================================================================
const db = require('../db');

/**
 * Creates an order + all line items inside ONE BEGIN IMMEDIATE transaction.
 *
 * @param {object} params
 * @param {string}       params.order_id   "ORD-<timestamp>"
 * @param {number|null}  params.user_id    null for guest checkout
 * @param {string}       params.email
 * @param {string}       params.card_last4 four digits only (PCI-DSS)
 * @param {number}       params.total      server-validated total
 * @param {string}       params.placed_at  ISO 8601 datetime
 * @param {Array<{workshop_id:number, quantity:number, unit_price:number}>} params.items
 *
 * @returns {Promise<
 *   { ok: true,  order_id: string } |
 *   { ok: false, conflict: { workshop_id: number, title: string } }
 * >}
 */
function createBooking({ order_id, user_id, email, card_last4, total, placed_at, items }) {
    return new Promise((resolve, reject) => {

        // ── Acquire write-lock immediately ──────────────────────────
        db.run('BEGIN IMMEDIATE', (beginErr) => {
            if (beginErr) return reject(beginErr);

            // ── Step 1: check capacity for every line item ──────────
            let checkIdx = 0;

            function checkCapacity() {
                if (checkIdx >= items.length) return insertOrder();

                const { workshop_id, quantity } = items[checkIdx++];

                db.get(
                    `SELECT id, title, max_capacity, current_bookings
                     FROM workshops WHERE id = ?`,
                    [workshop_id],
                    (err, row) => {
                        if (err) return rbReject(err);
                        if (!row) return rbReject(new Error(`Workshop ${workshop_id} not found`));

                        if (row.current_bookings + quantity > row.max_capacity) {
                            // Full — rollback and surface a structured 409 payload.
                            return rbResolve({
                                ok:       false,
                                conflict: { workshop_id: row.id, title: row.title },
                            });
                        }
                        checkCapacity();
                    }
                );
            }

            // ── Step 2: insert the parent orders row ─────────────────
            function insertOrder() {
                db.run(
                    `INSERT INTO orders
                       (order_id, user_id, email, card_last4, total, placed_at)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [order_id, user_id ?? null, email, card_last4, total, placed_at],
                    function (err) {
                        if (err) return rbReject(err);
                        insertItems(this.lastID, 0);   // this.lastID = PK of inserted row
                    }
                );
            }

            // ── Step 3: insert line items + increment bookings ────────
            function insertItems(dbOrderId, idx) {
                if (idx >= items.length) return commit();

                const { workshop_id, quantity, unit_price } = items[idx];

                db.run(
                    `INSERT INTO order_items
                       (order_id, workshop_id, quantity, unit_price, total_price)
                     VALUES (?, ?, ?, ?, ?)`,
                    [dbOrderId, workshop_id, quantity, unit_price, quantity * unit_price],
                    (err) => {
                        if (err) return rbReject(err);

                        db.run(
                            `UPDATE workshops
                             SET current_bookings = current_bookings + ?
                             WHERE id = ?`,
                            [quantity, workshop_id],
                            (err2) => {
                                if (err2) return rbReject(err2);
                                insertItems(dbOrderId, idx + 1);
                            }
                        );
                    }
                );
            }

            // ── Step 4: commit ────────────────────────────────────────
            function commit() {
                db.run('COMMIT', (err) => {
                    if (err) return rbReject(err);
                    resolve({ ok: true, order_id });
                });
            }

            // ── Helpers: always ROLLBACK before settling ─────────────
            function rbReject(err)    { db.run('ROLLBACK', () => reject(err)); }
            function rbResolve(value) { db.run('ROLLBACK', () => resolve(value)); }

            checkCapacity();
        });
    });
}

module.exports = { createBooking };