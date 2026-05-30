# WebTech Final — Skill-Share Workshop Platform

A full-stack workshop booking platform built as the final project for **Course 960121** (Spring 2026).

## Team

| Role | Member | Owns |
|------|--------|------|
| Lead Architect | Boypemt | Schema, transactions, JWT, `.env`, Go-Live Audit, `ARCHITECTURE.md` |
| Integration Engineer | Arm | API endpoints, `fetch()` logic, 409 handling, JWT state, hydration |
| UX Engineer | Farsai | Workshop cards, capacity badges, "Book Seat" UX, debouncing, CSS |

## The Niche — Skill-Share Workshop

A marketplace for booking seats in **live online classes** (e.g., "Intro to AI", "Sourdough Bread Making", "Watercolor Basics"). Every workshop has a fixed `max_capacity`; once it's full, no more bookings.

### Architectural twist — Real-time seat reservation

During checkout, the server runs:

```
current_bookings + requested_qty <= max_capacity ?
   YES → 201 Created · increment booking count
   NO  → 409 Conflict · "Workshop full" with workshop_id
```

### Bonus Challenge (+3 pts) — A. Stock-Check Concurrency

The capacity check **and** the booking insert are wrapped in a single `BEGIN IMMEDIATE TRANSACTION` so that when two users click "Book" on the last seat at the same millisecond, only one wins and the other gets `409 Conflict` — not a corrupted overbooking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Bootstrap 5.2.3 |
| Backend | Node.js, Express |
| Database | SQLite (via `sqlite3`, callback-based, Promise-wrapped) |
| Auth | bcrypt (salt rounds 10) + JWT (24h expiry) |
| Config | dotenv |

## Setup (Zero-Config)

```bash
git clone https://github.com/Boypemt/WebTechFinal.git
cd WebTechFinal
npm install
cp .env.example .env             # then fill in JWT_SECRET
node server/db/seed.js           # seed workshops + sample users
npm run dev                      # nodemon — auto-restarts on change
```

Open `http://localhost:3000/api/health` — should return `{ "success": true, "status": "ok" }`.

## Architectural Best Practices implemented

This project is the audited final form of every pattern taught in Sessions 1-10:

1. **Conventional Commits** & feature branches (`feat:`, `fix:`, `chore:`, `docs:`)
2. **Dynamic UI** rendered from `/api/workshops` — zero hard-coded content
3. **Event Delegation** on `#catalog` + **300ms debounce** on search input
4. **Single Source of Truth** — `cart[]` in `localStorage` with serialization
5. **Auth Architecture** — bcrypt hashing + stateless JWT, no plain-text passwords
6. **The Gatekeeper Pattern** — server re-validates prices and capacity before any insert
7. **Relational Integrity** — PK/FK constraints, `ON DELETE RESTRICT` on historical rows
8. **Parameterized Queries** — every SQL statement uses `?` placeholders, no concatenation
9. **Controller-Route-Service** separation, with a dedicated Repository layer for SQL
10. **Zero-Config + .env** — no secrets in source, project boots on any machine

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Why each pattern was chosen
- [docs/API.md](docs/API.md) — Full endpoint reference
- [docs/diagrams/](docs/diagrams/) — ERD, Component Diagram, Sequence Diagrams

## License

Educational project — Course 960121, Spring 2026.
