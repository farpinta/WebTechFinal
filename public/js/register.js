// ===================================================================
// public/js/register.js — Register page script
// ===================================================================
import { postRegister }                    from './api.js';
import { saveToken, isLoggedIn, initAuthUI } from './auth.js';

if (isLoggedIn()) window.location.replace('/index.html');

initAuthUI();

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const form      = e.target;
    const errorEl   = document.getElementById('register-error');
    const submitBtn = form.querySelector('[type="submit"]');

    errorEl.hidden     = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    try {
        const { token } = await postRegister({
            email:      form.email.value.trim(),
            password:   form.password.value,
            first_name: form.first_name.value.trim(),
        });

        saveToken(token);
        window.location.href = '/index.html';

    } catch (err) {
        const msg   = err.data?.error || 'Registration failed. Please try again.';
        const field = err.data?.field;

        errorEl.textContent = msg;
        errorEl.hidden      = false;

        // Focus the offending field when the server tells us which one
        if (field && form[field]) form[field].focus();

    } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Create Account';
    }
});