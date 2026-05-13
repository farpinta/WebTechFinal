# Architecture

This document explains the **why** behind every architectural decision. The rubric awards Score 3 (Mastery) only when a developer can articulate *why* a pattern was chosen — not just that it was implemented.

## Layered Architecture — Controller-Route-Service-Repository

```
Route → Controller → Service → Repository → DB
```

| Layer | Single responsibility |
|-------|----------------------|
| Route | URL → handler mapping only |
| Controller | HTTP: parse req, validate input, call service, send res |
| Service | Business rules (pricing, capacity check, bcrypt, JWT) |
| Repository | All SQL — one method per query |
| DB | SQLite connection + Promise wrappers |

**Why this split?** A schema change touches only the Repository. A business-rule change touches only the Service. They never collide.

## Database Schema

See [diagrams/erd.png](diagrams/erd.png).

Four tables: `users`, `workshops`, `orders`, `order_items`. Every FK uses `ON DELETE RESTRICT` on `order_items.workshop_id` so historical bookings cannot be silently broken when a workshop is removed.

## Component Diagram

See [diagrams/components.png](diagrams/components.png).

The dotted red **cut line** shows where the monolith could be split into three independent services: **Identity**, **Catalog**, and **Booking**.

## Concurrency — Bonus A — Stock-Check

When two users click "Book" on the last seat at the same millisecond, naive code lets **both** succeed because there is a TOCTOU (Time Of Check, Time Of Use) window between `SELECT capacity` and `UPDATE current_bookings`.

We close that window with:

```js
db.run('BEGIN IMMEDIATE TRANSACTION');
try {
  // SELECT + UPDATE happen under a write lock acquired immediately.
  // Any second request blocks until this transaction COMMITs.
  // ...
  db.run('COMMIT');
} catch (e) {
  db.run('ROLLBACK');   // capacity violated → 409, no partial booking
}
```

`BEGIN IMMEDIATE` (not `BEGIN DEFERRED`) acquires a `RESERVED` lock immediately, so SQLite serializes the contending writes for us.

## Security Decisions

- **bcrypt** with cost factor 10 — cost factor in `.env` so we can raise it as hardware improves.
- **JWT** signed with `process.env.JWT_SECRET`, `expiresIn: '24h'` — the secret never appears in source code.
- **Parameterized queries** everywhere — `?` placeholders, no string concatenation. Prevents SQL injection.
- **Body size limit** of 10KB — `express.json({ limit: '10kb' })` prevents memory-exhaustion attacks.
- **Generic error response** in production — clients never see stack traces.
- **Server-side re-pricing** in checkout — the Gatekeeper Pattern. The client's `total` is recalculated against `workshops.price_current` before any insert.

## Environment Variables — Zero-Config

All secrets and environment-dependent values are in `.env` (gitignored). The project boots only after `JWT_SECRET` is present — `server/index.js` fail-fasts with a helpful error otherwise.

## What's NOT yet documented (placeholders)

- API reference → see [API.md](API.md) *(Day 12)*
- Sequence Diagrams for the 3 main flows → `diagrams/seq-*.png` *(Day 12)*
- Race-condition demo recording → `diagrams/concurrency-demo.mp4` *(Day 9)*
