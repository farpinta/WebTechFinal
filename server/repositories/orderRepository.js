const db = require('../db');

// Returns the columns needed for a capacity check and price lock, or null if not found.
async function findWorkshopForCheckout(workshop_id) {
    return db.getAsync(
        'SELECT id, title, price_current, max_capacity, current_bookings FROM workshops WHERE id = ?',
        [workshop_id]
    );
}

// Inserts a new order header and returns the generated row id.
async function insertOrder({ order_id, user_id, email, card_last4, total, placed_at }) {
    const { lastID } = await db.runAsync(
        'INSERT INTO orders (order_id, user_id, email, card_last4, total, placed_at) VALUES (?, ?, ?, ?, ?, ?)',
        [order_id, user_id, email, card_last4, total, placed_at]
    );
    return { id: lastID };
}

// Inserts one line item linked to an order and returns the generated row id.
async function insertOrderItem({ order_id, workshop_id, quantity, unit_price, total_price }) {
    const { lastID } = await db.runAsync(
        'INSERT INTO order_items (order_id, workshop_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [order_id, workshop_id, quantity, unit_price, total_price]
    );
    return { id: lastID };
}

// Increments current_bookings atomically and returns the number of rows affected.
async function incrementBookings(workshop_id, quantity) {
    const { changes } = await db.runAsync(
        'UPDATE workshops SET current_bookings = current_bookings + ? WHERE id = ?',
        [quantity, workshop_id]
    );
    return { changes };
}

module.exports = { findWorkshopForCheckout, insertOrder, insertOrderItem, incrementBookings };
