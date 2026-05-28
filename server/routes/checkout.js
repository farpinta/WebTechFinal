const { Router }      = require('express');
const optionalAuth    = require('../middleware/optionalAuth');
const { placeOrder }  = require('../controllers/checkoutController');

const router = Router();

router.post('/', optionalAuth, placeOrder);

module.exports = router;
