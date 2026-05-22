// ===================================================================
// server/routes/checkout.js — POST /api/checkout
// Protected: authenticate middleware verifies the JWT before the
// checkout controller runs.
// ===================================================================
const { Router }   = require('express');
const authenticate = require('../middleware/authenticate');
const { checkout } = require('../controllers/checkoutController');

const router = Router();

router.post('/', authenticate, checkout);

module.exports = router;