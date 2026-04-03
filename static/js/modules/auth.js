import { showError, renderNav } from './ui.js';

export async function checkAuth() {
    try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success) {
            window.currentUser = data.user;
            renderNav(window.currentUser);
            return window.currentUser;
        }
    } catch (e) {
        console.error('Auth check failed', e);
    }
    window.currentUser = null;
    renderNav(null);
    return null;
}

export async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.currentUser = null;
    renderNav(null);
    window.location.href = '/';
}

window.logout = logout;