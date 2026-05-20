const { Router } = require('express');
const { register } = require('../controllers/authController');

const router = Router();

router.post('/', register);

module.exports = router;
