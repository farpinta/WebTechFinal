const db = require('../db');

// Returns a single user row (id, email, password_hash, first_name) or null if not found.
async function findByEmail(email) {
    return db.getAsync(
        'SELECT id, email, password_hash, first_name FROM users WHERE email = ?',
        [email]
    );
}

// Inserts a new user and returns { id, email, first_name } using the generated lastID.
async function create({ email, password_hash, first_name }) {
    const { lastID } = await db.runAsync(
        'INSERT INTO users (email, password_hash, first_name, registered_at) VALUES (?, ?, ?, ?)',
        [email, password_hash, first_name, new Date().toISOString()]
    );
    return { id: lastID, email, first_name };
}

module.exports = { findByEmail, create };
