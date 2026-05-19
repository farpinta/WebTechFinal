const { Router } = require('express');
const { listWorkshops, getWorkshop } = require('../controllers/workshopController');

const router = Router();

router.get('/', listWorkshops);
router.get('/:id', getWorkshop);

module.exports = router;
