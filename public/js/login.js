// ===================================================================
// public/js/login.js — Login page script
// ===================================================================
import { postLogin }                      from './api.js';
import { saveToken, isLoggedIn, initAuthUI } from './auth.js';

// Redirect users who are already logged in away from the login page
if (isLoggedIn()) window.location.replace('/index.html');

initAuthUI();

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form      = e.target;
    const errorEl   = document.getElementById('login-error');
    const submitBtn = form.querySelector('[type="submit"]');

    errorEl.hidden     = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';

    try {
        const { token } = await postLogin({
            email:    form.email.value.trim(),
            password: form.password.value,
        });

        saveToken(token);

        // Honor the ?redirect= param so protected pages can send the
        // user back after a successful login.
        const params   = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/index.html';
        window.location.href = redirect;

    } catch (err) {
        errorEl.textContent = err.data?.error || 'Invalid email or password.';
        errorEl.hidden      = false;
    } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Login';
    }
});