-- ===================================================================
-- schema.sql — DDL for the Skill-Share Workshop platform
-- Idempotent: every CREATE uses IF NOT EXISTS, so re-running is safe.
-- Loaded automatically on every server start by server/db/index.js.
-- ===================================================================

-- SQLite has foreign keys DISABLED by default — turn them on.
PRAGMA foreign_keys = ON;

-- -------------------------------------------------------------------
-- users — registered accounts
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    UNIQUE NOT NULL,
    password_hash   TEXT    NOT NULL,              -- bcrypt output
    first_name      TEXT    NOT NULL,
    registered_at   TEXT    NOT NULL               -- ISO 8601 datetime
);

-- -------------------------------------------------------------------
-- workshops — the catalog
-- max_capacity + current_bookings are the niche columns (Session 10, slide 15).
-- The CHECK constraints make it physically impossible to corrupt either value.
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workshops (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    title              TEXT    NOT NULL,
    category           TEXT    NOT NULL,
    instructor         TEXT    NOT NULL,
    image              TEXT,
    description        TEXT,
    scheduled_at       TEXT    NOT NULL,                              -- ISO 8601 datetime
    duration_min       INTEGER NOT NULL CHECK (duration_min > 0),
    max_capacity       INTEGER NOT NULL CHECK (max_capacity > 0),
    current_bookings   INTEGER NOT NULL DEFAULT 0
                                CHECK (current_bookings >= 0
                                       AND current_bookings <= max_capacity),
    price_current      REAL    NOT NULL CHECK (price_current >= 0),
    badge              TEXT,                                          -- "New" | "Popular" | NULL
    rating             REAL    CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
    review_count       INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0)
);

-- -------------------------------------------------------------------
-- orders — one row per checkout
-- user_id is NULLABLE so guest bookings still work.
-- ON DELETE SET NULL keeps the order history if a user deletes their account.
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     TEXT    UNIQUE NOT NULL,                  -- "ORD-<timestamp>"
    user_id      INTEGER,
    email        TEXT    NOT NULL,
    card_last4   TEXT    NOT NULL,                         -- PCI-DSS: store last 4 only
    total        REAL    NOT NULL CHECK (total >= 0),
    placed_at    TEXT    NOT NULL,                         -- ISO 8601 datetime
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- -------------------------------------------------------------------
-- order_items — one row per line item
-- ON DELETE RESTRICT on workshop_id ensures we cannot delete a workshop
--   that appears in someone's booking history.
-- ON DELETE CASCADE on order_id cleans up line items if the parent order goes.
-- -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id     INTEGER NOT NULL,
    workshop_id  INTEGER NOT NULL,
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    unit_price   REAL    NOT NULL CHECK (unit_price  >= 0),
    total_price  REAL    NOT NULL CHECK (total_price >= 0),
    FOREIGN KEY (order_id)    REFERENCES orders(id)    ON DELETE CASCADE,
    FOREIGN KEY (workshop_id) REFERENCES workshops(id) ON DELETE RESTRICT
);

-- -------------------------------------------------------------------
-- Indexes — speed up the most common queries
-- -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_workshops_category ON workshops(category);
CREATE INDEX IF NOT EXISTS idx_orders_user        ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_placed_at   ON orders(placed_at);
CREATE INDEX IF NOT EXISTS idx_items_order        ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_items_workshop     ON order_items(workshop_id);
