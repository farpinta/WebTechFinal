// ===================================================================
// server/db/seed.js — One-time seeder for workshops + test users
//
// Safe to re-run: users use INSERT OR IGNORE (email is UNIQUE);
//                  workshops are skipped if the table already has rows.
//
// Run with:   node server/db/seed.js
// ===================================================================
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./index');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

// -------------------------------------------------------------------
// Test users — plaintext passwords here are FOR SEEDING ONLY.
// We bcrypt-hash them at insert time. The plaintext is never stored.
// -------------------------------------------------------------------
const SEED_USERS = [
    { email: 'alice@example.com', password: 'Password123!', first_name: 'Alice' },
    { email: 'bob@example.com',   password: 'Password123!', first_name: 'Bob'   },
    { email: 'admin@example.com', password: 'Admin12345!',  first_name: 'Admin' },
];

// -------------------------------------------------------------------
// 12 workshops — 3 per category, mixed capacity & demand levels.
// Tip: a few are intentionally near-capacity so you can test the 409
// flow without much effort.
// -------------------------------------------------------------------
const SEED_WORKSHOPS = [
    // ---------- Tech ----------
    { title: 'Intro to AI Coding',       category: 'Tech',    instructor: 'Dr. Tanya Lee',
      image: 'https://dummyimage.com/450x300/2563eb/ffffff&text=Intro+to+AI',
      description: 'A hands-on intro to using AI in your daily workflow.',
      scheduled_at: '2026-05-25T19:00:00Z', duration_min:  90, max_capacity: 30,
      current_bookings: 12, price_current: 29.99, badge: 'Popular', rating: 4.7, review_count: 142 },
    { title: 'JavaScript Bootcamp',      category: 'Tech',    instructor: 'Marcus Chen',
      image: 'https://dummyimage.com/450x300/2563eb/ffffff&text=JS+Bootcamp',
      description: 'From variables to async/await in one evening.',
      scheduled_at: '2026-05-27T18:30:00Z', duration_min: 120, max_capacity: 25,
      current_bookings: 20, price_current: 39.99, badge: null,       rating: 4.5, review_count:  89 },
    { title: 'Web Security 101',         category: 'Tech',    instructor: 'Priya Sharma',
      image: 'https://dummyimage.com/450x300/2563eb/ffffff&text=Web+Security',
      description: 'XSS, CSRF, SQL injection — and how to stop them.',
      scheduled_at: '2026-06-01T20:00:00Z', duration_min:  90, max_capacity: 20,
      current_bookings: 20, price_current: 49.99, badge: null,       rating: 4.9, review_count:  56 },

    // ---------- Cooking ----------
    { title: 'Sourdough Bread Making',   category: 'Cooking', instructor: 'Chef Olivier',
      image: 'https://dummyimage.com/450x300/f97316/ffffff&text=Sourdough',
      description: 'Start a starter, shape a loaf, bake at home.',
      scheduled_at: '2026-05-28T17:00:00Z', duration_min: 180, max_capacity: 15,
      current_bookings:  8, price_current: 35.00, badge: 'New',      rating: 4.8, review_count:  23 },
    { title: 'Thai Curry Night',         category: 'Cooking', instructor: 'Som Tam',
      image: 'https://dummyimage.com/450x300/f97316/ffffff&text=Thai+Curry',
      description: 'Three curries, one pestle, lots of basil.',
      scheduled_at: '2026-05-30T19:00:00Z', duration_min: 120, max_capacity: 12,
      current_bookings:  5, price_current: 28.50, badge: null,       rating: 4.6, review_count:  41 },
    { title: 'Pasta from Scratch',       category: 'Cooking', instructor: 'Nonna Carla',
      image: 'https://dummyimage.com/450x300/f97316/ffffff&text=Fresh+Pasta',
      description: 'Egg dough, hand-rolled, served with butter and sage.',
      scheduled_at: '2026-06-03T18:00:00Z', duration_min: 150, max_capacity: 10,
      current_bookings: 10, price_current: 45.00, badge: null,       rating: 4.9, review_count:  78 },

    // ---------- Music ----------
    { title: 'Acoustic Guitar Basics',   category: 'Music',   instructor: 'Joe Davies',
      image: 'https://dummyimage.com/450x300/16a34a/ffffff&text=Guitar',
      description: 'First chords, your first song, by end of night.',
      scheduled_at: '2026-05-26T20:00:00Z', duration_min:  60, max_capacity: 20,
      current_bookings:  4, price_current: 19.99, badge: 'New',      rating: 4.4, review_count:  31 },
    { title: 'Songwriting Workshop',     category: 'Music',   instructor: 'Aisha Roy',
      image: 'https://dummyimage.com/450x300/16a34a/ffffff&text=Songwriting',
      description: 'Verse, chorus, bridge — and the magic of a hook.',
      scheduled_at: '2026-05-31T19:30:00Z', duration_min:  90, max_capacity: 18,
      current_bookings: 11, price_current: 32.00, badge: null,       rating: 4.7, review_count:  67 },
    { title: 'Mixing in Logic Pro',      category: 'Music',   instructor: 'DJ Kaze',
      image: 'https://dummyimage.com/450x300/16a34a/ffffff&text=Mixing',
      description: 'EQ, compression, reverb — make a bedroom track sound pro.',
      scheduled_at: '2026-06-04T20:30:00Z', duration_min: 120, max_capacity: 15,
      current_bookings:  7, price_current: 42.00, badge: null,       rating: 4.6, review_count:  38 },

    // ---------- Art ----------
    { title: 'Watercolor for Beginners', category: 'Art',     instructor: 'Maya Park',
      image: 'https://dummyimage.com/450x300/a855f7/ffffff&text=Watercolor',
      description: 'Wet-on-wet, glazing, and one finished landscape.',
      scheduled_at: '2026-05-29T15:00:00Z', duration_min: 120, max_capacity: 20,
      current_bookings: 15, price_current: 25.00, badge: 'Popular',  rating: 4.8, review_count:  94 },
    { title: 'Digital Illustration',     category: 'Art',     instructor: 'Tom Yoshida',
      image: 'https://dummyimage.com/450x300/a855f7/ffffff&text=Digital+Art',
      description: 'Procreate fundamentals — sketch to finished piece.',
      scheduled_at: '2026-06-02T19:00:00Z', duration_min:  90, max_capacity: 25,
      current_bookings: 18, price_current: 35.00, badge: null,       rating: 4.5, review_count:  52 },
    { title: 'Calligraphy Foundations',  category: 'Art',     instructor: 'Sara Wong',
      image: 'https://dummyimage.com/450x300/a855f7/ffffff&text=Calligraphy',
      description: 'Brush pens, modern script, and a wedding-worthy envelope.',
      scheduled_at: '2026-06-05T18:00:00Z', duration_min:  90, max_capacity: 15,
      current_bookings:  6, price_current: 22.00, badge: null,       rating: 4.7, review_count:  29 },
];

// -------------------------------------------------------------------
async function seedUsers() {
    const now = new Date().toISOString();
    for (const u of SEED_USERS) {
        const hash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
        await db.runAsync(
            `INSERT OR IGNORE INTO users (email, password_hash, first_name, registered_at)
             VALUES (?, ?, ?, ?)`,
            [u.email, hash, u.first_name, now]
        );
    }
    console.log(`  ✓ users seeded (${SEED_USERS.length})`);
}

async function seedWorkshops() {
    const row = await db.getAsync('SELECT COUNT(*) AS n FROM workshops');
    if (row && row.n > 0) {
        console.log(`  ⤵ workshops already populated (${row.n} rows) — skipping`);
        return;
    }
    for (const w of SEED_WORKSHOPS) {
        await db.runAsync(
            `INSERT INTO workshops
              (title, category, instructor, image, description, scheduled_at,
               duration_min, max_capacity, current_bookings, price_current,
               badge, rating, review_count)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [w.title, w.category, w.instructor, w.image, w.description, w.scheduled_at,
             w.duration_min, w.max_capacity, w.current_bookings, w.price_current,
             w.badge, w.rating, w.review_count]
        );
    }
    console.log(`  ✓ workshops seeded (${SEED_WORKSHOPS.length})`);
}

// -------------------------------------------------------------------
// Give schema.sql a moment to apply (it runs async on db open),
// then seed everything in sequence.
// -------------------------------------------------------------------
setTimeout(async () => {
    try {
        console.log('Seeding store.db ...');
        await seedUsers();
        await seedWorkshops();
        console.log('Seed complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}, 250);
