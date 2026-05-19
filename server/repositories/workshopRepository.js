const db = require('../db');

// Returns all workshops ordered by scheduled date ascending.
async function findAll() {
    return db.allAsync(
        'SELECT * FROM workshops ORDER BY scheduled_at ASC'
    );
}

// Returns workshops whose category matches case-insensitively, ordered by scheduled date.
async function findByCategory(category) {
    return db.allAsync(
        'SELECT * FROM workshops WHERE LOWER(category) = LOWER(?) ORDER BY scheduled_at ASC',
        [category]
    );
}

// Returns a single workshop row by id, or null if not found.
async function findById(id) {
    return db.getAsync(
        'SELECT * FROM workshops WHERE id = ?',
        [id]
    );
}

module.exports = { findAll, findByCategory, findById };
