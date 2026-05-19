const repo = require('../repositories/workshopRepository');

function toShape(row) {
    return {
        id:               row.id,
        title:            row.title,
        category:         row.category,
        instructor:       row.instructor,
        image:            row.image,
        description:      row.description,
        scheduledAt:      row.scheduled_at,
        durationMin:      row.duration_min,
        maxCapacity:      row.max_capacity,
        currentBookings:  row.current_bookings,
        price:            { current: row.price_current },
        badge:            row.badge,
        rating:           row.rating,
        reviewCount:      row.review_count,
    };
}

// Enforces category validation so the Repository never receives untrusted input.
async function getAllWorkshops({ category } = {}) {
    if (category !== undefined) {
        if (typeof category !== 'string' || category.length < 1 || category.length > 50) {
            throw new Error('Invalid category');
        }
        const rows = await repo.findByCategory(category);
        return rows.map(toShape);
    }
    const rows = await repo.findAll();
    return rows.map(toShape);
}

// Isolates the id→shaped-object concern so Controllers never touch raw DB columns.
async function getWorkshopById(id) {
    const row = await repo.findById(id);
    return row ? toShape(row) : null;
}

module.exports = { getAllWorkshops, getWorkshopById };
