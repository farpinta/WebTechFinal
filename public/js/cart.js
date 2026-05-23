// ===================================================================
// public/js/cart.js — Cart state  (localStorage single source of truth)
//
// README architectural best-practice #4:
//   "Single Source of Truth — cart[] in localStorage with serialisation"
//
// Every module that needs cart data imports from here — no direct
// localStorage.getItem('cart') calls elsewhere.
//
// Shape of a cart item:
//   { id: number, title: string, price: number, quantity: number }
// ===================================================================

const CART_KEY = 'cart';

/** @returns {CartItem[]} Current cart (empty array if nothing stored) */
export function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
        return [];
    }
}

/** Persist the full cart array, replacing whatever was there. */
function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

/**
 * Add a workshop to the cart or increment its quantity.
 * @param {{ id: number, title: string, price: number }} workshop
 * @param {number} [quantity=1]
 */
export function addToCart(workshop, quantity = 1) {
    const cart    = getCart();
    const existing = cart.find((item) => item.id === workshop.id);

    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id: workshop.id, title: workshop.title, price: workshop.price, quantity });
    }
    saveCart(cart);
    dispatchCartChange();
}

/**
 * Remove one workshop entirely from the cart.
 * @param {number} workshopId
 */
export function removeFromCart(workshopId) {
    saveCart(getCart().filter((item) => item.id !== workshopId));
    dispatchCartChange();
}

/** Empty the cart completely (called after a successful checkout). */
export function clearCart() {
    localStorage.removeItem(CART_KEY);
    dispatchCartChange();
}

/** Total number of items (sum of quantities) across all workshops. */
export function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

// Broadcasts a custom event so any page element can react to cart changes
// without polling — e.g. the navbar count badge.
function dispatchCartChange() {
    window.dispatchEvent(new CustomEvent('cart:change', { detail: { count: getCartCount() } }));
}