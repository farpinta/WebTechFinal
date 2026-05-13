// ===================================================================
// server/index.js — Entry point
// MUST be the first place dotenv loads, so every downstream require()
// sees the env variables already in process.env.
// ===================================================================
require('dotenv').config();

const app = require('./app');

// --- Fail-fast: refuse to start if a required secret is missing -----
// (Session 10 "Zero-Config" test — graceful crash with a clear message)
const REQUIRED_ENV = ['JWT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: Required env variable "${key}" is missing.`);
    console.error('Did you forget to copy .env.example to .env?');
    process.exit(1);
  }
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Health check:        http://localhost:${PORT}/api/health`);
});
