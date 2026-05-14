// ===================================================================
// server/db/index.js — SQLite connection + Promise wrappers
//
// sqlite3 is callback-based; we wrap it with Promise helpers so the
// Service and Repository layers can use async/await cleanly.
// Pattern is the same one taught in Session 8.
// ===================================================================
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();

// --- Resolve DB path from .env (default: server/db/store.db) -------
const DB_PATH = process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, 'store.db');

// Make sure the parent directory exists before sqlite3 tries to open it.
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// --- Open the connection -------------------------------------------
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('FATAL: failed to open SQLite database at', DB_PATH);
        console.error(err.message);
        process.exit(1);
    }
});

// --- Foreign keys are OFF by default in SQLite — enable per session.
db.run('PRAGMA foreign_keys = ON');

// --- Run schema.sql on every startup -------------------------------
// (Every CREATE in schema.sql uses IF NOT EXISTS so this is idempotent.)
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
        if (err) {
            console.error('FATAL: failed to apply schema.sql');
            console.error(err.message);
            process.exit(1);
        }
    });
}

// --- Promise wrappers around sqlite3's callback API ----------------
// Every Repository method should use one of these — never raw db.run().
db.allAsync = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
    );

db.getAsync = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)))
    );

db.runAsync = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.run(sql, params, function (err) {
            // arrow fn would lose `this`, which sqlite3 needs for lastID/changes
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        })
    );

module.exports = db;
