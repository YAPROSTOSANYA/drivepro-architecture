import { renderNav, showError } from './ui.js';

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

// Функции валидации
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePassword(password) {
    // минимум 6 символов, хотя бы одна цифра и одна буква
    const re = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return re.test(password);
}

export function validateName(name) {
    return name && name.trim().length >= 2;
}

export function showValidationError(field, message) {
    const input = document.getElementById(field);
    if (input) {
        const existingError = input.parentElement?.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.style.color = 'red';
        errorSpan.style.fontSize = '12px';
        errorSpan.style.display = 'block';
        errorSpan.style.marginTop = '-10px';
        errorSpan.style.marginBottom = '10px';
        errorSpan.innerText = message;

        input.parentElement?.appendChild(errorSpan);

        setTimeout(() => {
            errorSpan.remove();
        }, 3000);
    }
}