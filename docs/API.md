# API Reference — Skill-Share Workshop Platform

Base URL: `http://localhost:3000`

All responses use one of three envelopes — see [Response envelope rules](#response-envelope-rules).

---

## GET /api/workshops

**Auth:** none

Returns all workshops, or a filtered subset when `?category=` is supplied.

**Query parameters**

| Param | Type | Constraints |
|---|---|---|
| `category` | string | optional; 1–50 chars |

**Success — 200**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "title": "Intro to Sourdough",
      "category": "Cooking",
      "instructor": "Chef Lek",
      "image": "https://placehold.co/400x250?text=Sourdough",
      "description": "Learn the basics of sourdough fermentation.",
      "scheduledAt": "2026-06-10T09:00:00.000Z",
      "durationMin": 120,
      "maxCapacity": 20,
      "currentBookings": 5,
      "price": { "current": 890 },
      "badge": "Popular",
      "rating": 4.8,
      "reviewCount": 42
    }
  ]
}
```

**Errors**

| Status | Trigger | Body |
|---|---|---|
| 400 | `category` is present but < 1 or > 50 chars | `{ "success": false, "error": "Invalid category", "field": "category" }` |

---

## GET /api/workshops/:id

**Auth:** none

Returns a single workshop by integer id.

**Success — 200**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "title": "Web Security 101",
    "category": "Technology",
    "instructor": "Dr. Somchai",
    "image": "https://placehold.co/400x250?text=Security",
    "description": "XSS, CSRF, and SQL injection explained.",
    "scheduledAt": "2026-06-14T13:00:00.000Z",
    "durationMin": 90,
    "maxCapacity": 15,
    "currentBookings": 15,
    "price": { "current": 1200 },
    "badge": "New",
    "rating": 4.9,
    "reviewCount": 8
  }
}
```

**Errors**

| Status | Trigger | Body |
|---|---|---|
| 400 | `:id` is not a valid integer | `{ "success": false, "error": "Invalid workshop id" }` |
| 404 | No workshop with that id | `{ "success": false, "error": "Workshop not found" }` |

---

## POST /api/register

**Auth:** none

Creates a new user account, returns a signed JWT.

**Request body**
```json
{
  "email": "ada@example.com",
  "password": "Secure1!pass",
  "first_name": "Ada"
}
```

| Field | Type | Constraints |
|---|---|---|
| `email` | string | must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `password` | string | ≥ 8 chars, at least one digit, at least one symbol |
| `first_name` | string | 1–50 chars |

**Success — 201**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "user": {
    "id": 7,
    "email": "ada@example.com",
    "first_name": "Ada"
  }
}
```

**Errors**

| Status | Trigger | Body |
|---|---|---|
| 400 | `email` missing or malformed | `{ "success": false, "error": "Invalid email address", "field": "email" }` |
| 400 | `password` fails rules | `{ "success": false, "error": "Password must be at least 8 characters and contain a digit and a symbol", "field": "password" }` |
| 400 | `first_name` missing or out of range | `{ "success": false, "error": "First name must be 1–50 characters", "field": "first_name" }` |
| 409 | Email already registered | `{ "success": false, "error": "Email already registered" }` |

---

## POST /api/login

**Auth:** none

Authenticates an existing user, returns a signed JWT.

**Request body**
```json
{
  "email": "ada@example.com",
  "password": "Secure1!pass"
}
```

**Success — 200**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "user": {
    "id": 7,
    "first_name": "Ada"
  }
}
```

**Errors**

| Status | Trigger | Body |
|---|---|---|
| 400 | `email` or `password` field missing | `{ "success": false, "error": "Email and password are required" }` |
| 401 | Email not found **or** password incorrect | `{ "success": false, "error": "Invalid email or password" }` |

> Both wrong-email and wrong-password return the identical 401 body — see [envelope rules](#response-envelope-rules).

---

## POST /api/checkout

**Auth:** optional JWT (`Authorization: Bearer <token>`)

Books one or more workshop seats. Validates capacity server-side and re-prices from the database.

**Request body**
```json
{
  "items": [
    { "id": 1, "quantity": 2 }
  ],
  "email": "guest@example.com",
  "card": "4242424242424242"
}
```

| Field | Type | Constraints |
|---|---|---|
| `items` | array | non-empty; each entry: `id` integer, `quantity` positive integer |
| `email` | string | must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| `card` | string | exactly 16 digits — only last 4 are stored |

**Success — 201**
```json
{
  "success": true,
  "data": {
    "order_id": "ORD-1748505600000",
    "total": 1780,
    "placed_at": "2026-05-29T08:00:00.000Z",
    "items": [
      {
        "workshop_id": 1,
        "quantity": 2,
        "unit_price": 890,
        "total_price": 1780
      }
    ]
  }
}
```

**Errors**

| Status | Trigger | Body |
|---|---|---|
| 400 | `items` missing, not an array, or empty | `{ "success": false, "error": "items must be a non-empty array", "field": "items" }` |
| 400 | Any item has non-integer `id` or `quantity < 1` | `{ "success": false, "error": "Each item must have an integer id and a positive integer quantity", "field": "items" }` |
| 400 | `email` missing or malformed | `{ "success": false, "error": "Invalid email address", "field": "email" }` |
| 400 | `card` missing, not 16 digits, or contains letters | `{ "success": false, "error": "Card must be exactly 16 digits", "field": "card" }` |
| 404 | A workshop id in `items` does not exist | `{ "success": false, "error": "Workshop not found", "workshopId": 99 }` |
| 409 | A workshop has insufficient remaining seats | `{ "success": false, "error": "Workshop full", "workshopId": 3 }` |
| 500 | Unexpected server error | `{ "success": false, "error": "Internal server error" }` |

---

## Response envelope rules

- **Consistent wrapper on every response.** Every endpoint — success or error — returns an object with a `success` boolean. Clients can branch on `if (data.success)` without inspecting HTTP status codes or guessing the shape of error payloads.

- **Login returns identical 401 bodies for wrong email and wrong password.** If wrong-email returned 404 and wrong-password returned 401, an attacker could enumerate which emails are registered by watching the status code. A single generic message makes both cases indistinguishable.

- **Checkout returns 409, not 200 with an error flag, when a workshop is full.** A non-2xx status forces the client to handle the failure path explicitly; a 200-with-error is easy to silently swallow. 409 Conflict is also semantically correct — the request was valid, but the current resource state prevents it from completing.

- **`card_last4` is stored; the full card number never is.** PCI-DSS prohibits storing primary account numbers (PANs) without encryption and extensive audit controls. The server slices the last 4 digits immediately on receipt and discards the rest — the full 16-digit number never touches the database or any log.
