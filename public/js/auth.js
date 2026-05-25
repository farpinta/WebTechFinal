// ===================================================================
// public/js/auth.js — JWT token storage and auth state
//
// Single source of truth for authentication on the frontend.
// Every other module reads user identity through getUser() /
// isLoggedIn() — direct localStorage access for auth is only here.
//
// Design notes:
//   • saveToken / getToken / clearToken are the only places that
//     touch the 'jwt_token' key in localStorage.
//   • getUser() decodes the JWT payload client-side WITHOUT verifying
//     the signature. Signature verification always happens server-side
//     on every protected request — this is just for display purposes
//     (e.g. showing "Hi, Arm" in the nav).
//   • isLoggedIn() checks the exp claim so stale tokens don't leave
//     the user "logged in" visually after the 24h window.
// ===================================================================

const TOKEN_KEY = 'jwt_token';

// ── Token persistence ────────────────────────────────────────────────

/** Save the JWT returned by /api/login or /api/register. */
export function saveToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

/** Retrieve the stored JWT, or null if the user is logged out. */
export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

/** Remove the JWT — this is the complete logout action. */
export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

// ── Decoded payload ──────────────────────────────────────────────────

/**
 * Decode the JWT payload (middle base64url segment) without verifying
 * the signature. Returns null if no token exists or if the token is
 * structurally malformed.
 *
 * @returns {{ id: number, email: string, first_name: string, exp: number } | null}
 */
export function getUser() {
    const token = getToken();
    if (!token) return null;

    try {
        // JWT format: <header>.<payload>.<signature>
        // payload is base64url-encoded JSON.
        const [, payloadB64] = token.split('.');
        const json = atob(
            payloadB64
                .replace(/-/g, '+')   // base64url → base64
                .replace(/_/g, '/')
        );
        return JSON.parse(json);
    } catch {
        return null;   // malformed token — treat as logged out
    }
}

/**
 * Returns true only if a token exists AND its exp timestamp
 * has not yet passed. This is a UX hint; the server always
 * performs the authoritative verification.
 */
export function isLoggedIn() {
    const user = getUser();
    if (!user || !user.exp) return false;
    return user.exp * 1000 > Date.now();   // exp is seconds; Date.now() is ms
}

// ── Nav hydration ────────────────────────────────────────────────────

/**
 * Hydrates the navbar auth state and optionally enforces auth.
 * Call once at the top of every page script.
 *
 * @param {{ requireAuth?: boolean }} [opts]
 *   requireAuth: redirect to /login.html when the user is not logged in.
 */
export function initAuthUI({ requireAuth = false } = {}) {
    const loggedIn = isLoggedIn();
    const user     = getUser();

    // Redirect unauthenticated users away from protected pages
    if (requireAuth && !loggedIn) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login.html?redirect=${redirect}`;
        return;
    }

    // Populate nav elements (Farsai styles them; Arm wires the data).
    const navUsername = document.getElementById('nav-username');
    const navLogin    = document.getElementById('nav-login');
    const navLogout   = document.getElementById('nav-logout');
    const cartCount   = document.getElementById('cart-count');

    if (navUsername) navUsername.textContent = loggedIn ? `Hi, ${user.first_name}` : '';
    if (navLogin)    navLogin.hidden          = loggedIn;
    if (navLogout)   navLogout.hidden         = !loggedIn;

    // Keep cart count badge in sync with localStorage
    if (cartCount) {
        try {
            const cart  = JSON.parse(localStorage.getItem('cart') || '[]');
            const count = cart.reduce((s, i) => s + (i.quantity || 1), 0);
            cartCount.textContent = count;
        } catch {
            cartCount.textContent = '0';
        }
    }

    // Logout handler — clears token and returns to catalog
    navLogout?.addEventListener('click', (e) => {
        e.preventDefault();
        clearToken();
        window.location.href = '/index.html';
    });
}