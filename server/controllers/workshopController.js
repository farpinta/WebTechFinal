const workshopService = require('../services/workshopService');

async function listWorkshops(req, res, next) {
    try {
        const { category } = req.query;
        const data = await workshopService.getAllWorkshops({ category });
        res.json({ success: true, count: data.length, data });
    } catch (err) {
        if (err.message === 'Invalid category') {
            return res.status(400).json({ success: false, error: 'Invalid category', field: 'category' });
        }
        next(err);
    }
}

async function getWorkshop(req, res, next) {
    try {
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) {
            return res.status(400).json({ success: false, error: 'Invalid workshop id' });
        }
        const data = await workshopService.getWorkshopById(id);
        if (!data) {
            return res.status(404).json({ success: false, error: 'Workshop not found' });
        }
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
}

module.exports = { listWorkshops, getWorkshop };
