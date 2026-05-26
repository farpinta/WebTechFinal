// ===================================================================
// public/js/catalog.js — Hydrates the workshop catalog from the API
//
// Arm owns: fetch data → render into DOM skeleton.
// Farsai owns: .workshop-card CSS classes, capacity badge styles,
//              debounced search (300ms), Book Seat click handler UX.
//
// Arm's renderWorkshops() produces the raw HTML structure and
// semantic class names; Farsai's CSS makes it look good.
// ===================================================================
import { getWorkshops }         from './api.js';
import { initAuthUI }           from './auth.js';
import { addToCart, getCartCount } from './cart.js';

// ── DOM refs ─────────────────────────────────────────────────────────
const catalogEl   = document.getElementById('catalog');
const skeletonEl  = document.getElementById('catalog-skeleton');
const errorEl     = document.getElementById('catalog-error');
const cartCountEl = document.getElementById('cart-count');

// ── Render ───────────────────────────────────────────────────────────

/**
 * Converts an array of Workshop objects (from the API) into card HTML
 * and injects it into #catalog.
 *
 * Class names are chosen for Farsai's CSS to target:
 *   .workshop-card, .workshop-card__img, .workshop-card__body,
 *   .workshop-card__category, .workshop-card__title,
 *   .workshop-card__instructor, .workshop-card__desc,
 *   .workshop-card__price, .workshop-card__seats,
 *   .seats--open, .seats--full, .workshop-badge, .btn-book-seat
 *
 * @param {Workshop[]} workshops
 */
function renderWorkshops(workshops) {
    if (!catalogEl) return;

    if (workshops.length === 0) {
        catalogEl.innerHTML = `
          <div class="col-12 text-center py-5 text-muted">
            <p>No workshops found. Try a different category or search term.</p>
          </div>`;
        return;
    }

    catalogEl.innerHTML = workshops.map((w) => {
        const seatsLeft = w.maxCapacity - w.currentBookings;
        const isFull    = seatsLeft <= 0;
        const badgeHtml = w.badge
            ? `<span class="workshop-badge">${w.badge}</span>`
            : '';
        const ratingHtml = w.rating
            ? `<span class="workshop-card__rating">★ ${w.rating.toFixed(1)}</span>
               <span class="workshop-card__review-count">(${w.reviewCount})</span>`
            : '';

        return `
          <div class="col" data-workshop-id="${w.id}">
            <article class="workshop-card h-100" aria-label="${w.title}">
              ${badgeHtml}
              <img class="workshop-card__img"
                   src="${w.image || '/img/placeholder.jpg'}"
                   alt="${w.title}"
                   loading="lazy" />
              <div class="workshop-card__body">
                <span class="workshop-card__category">${w.category}</span>
                <h3 class="workshop-card__title">${w.title}</h3>
                <p  class="workshop-card__instructor">with ${w.instructor}</p>
                <p  class="workshop-card__desc">${w.description || ''}</p>

                <div class="workshop-card__meta">
                  <span class="workshop-card__price">
                    ฿${w.price.current.toLocaleString()}
                  </span>
                  <!-- Capacity badge — Farsai styles .seats--open / .seats--full -->
                  <span class="workshop-card__seats ${isFull ? 'seats--full' : 'seats--open'}"
                        aria-label="${isFull ? 'Workshop full' : `${seatsLeft} seats remaining`}">
                    ${isFull ? 'Full' : `${seatsLeft} seat${seatsLeft !== 1 ? 's' : ''} left`}
                  </span>
                  ${ratingHtml}
                </div>

                <!-- Book Seat — Farsai wires the click-to-cart UX;
                     data-* attributes carry all needed values. -->
                <button class="btn-book-seat"
                        data-id="${w.id}"
                        data-title="${w.title}"
                        data-price="${w.price.current}"
                        ${isFull ? 'disabled' : ''}
                        aria-disabled="${isFull}">
                  ${isFull ? 'Workshop Full' : 'Book Seat'}
                </button>
              </div>
            </article>
          </div>`;
    }).join('');
}

// ── Fetch + render lifecycle ─────────────────────────────────────────

/**
 * Fetches workshops (optionally filtered) and renders them.
 * Manages skeleton loader and error banner automatically.
 *
 * @param {string|undefined} category  Optional category filter
 */
export async function loadCatalog(category) {
    if (skeletonEl) skeletonEl.hidden = false;
    if (catalogEl)  catalogEl.innerHTML = '';
    if (errorEl)    errorEl.hidden = true;

    try {
        const { data } = await getWorkshops(category);
        renderWorkshops(data);
    } catch (err) {
        console.error('[catalog] failed to load workshops', err);
        if (errorEl) {
            errorEl.textContent = 'Could not load workshops. Please try again later.';
            errorEl.hidden = false;
        }
    } finally {
        if (skeletonEl) skeletonEl.hidden = true;
    }
}

// ── Event delegation — "Book Seat" clicks ────────────────────────────
// Arm wires the data layer; Farsai owns the visual feedback UX.
catalogEl?.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-book-seat');
    if (!btn || btn.disabled) return;

    addToCart({
        id:    Number(btn.dataset.id),
        title: btn.dataset.title,
        price: Number(btn.dataset.price),
    });

    // Update cart badge in nav immediately
    if (cartCountEl) cartCountEl.textContent = getCartCount();
});

// ── Keep nav cart badge in sync when other pages modify the cart ─────
window.addEventListener('cart:change', ({ detail }) => {
    if (cartCountEl) cartCountEl.textContent = detail.count;
});

// ── Boot ─────────────────────────────────────────────────────────────
initAuthUI();
loadCatalog();