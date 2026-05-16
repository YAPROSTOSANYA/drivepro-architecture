import { renderNav, showNotification } from './ui.js';

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
    // Очищаем состояние при отсутствии авторизации или ошибке
    window.currentUser = null;
    renderNav(null);
    return null;
}

export async function logout() {
    try {
        await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
        console.error('Logout error', e);
    }
    // Очищаем состояние даже при ошибке запроса
    window.currentUser = null;
    renderNav(null);
    window.location.href = '/';
}

// Экспортируем в глобальный объект для вызова из HTML-атрибутов
window.logout = logout;

export function validateEmail(email) {
    // Email должен содержать @ и точку после неё, без пробелов
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function validatePassword(password) {
    // Проверка: длина от 6 символов, наличие заглавной, строчной, цифры и спецсимвола
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return re.test(password);
}

export function validateName(name) {
    return name && name.trim().length >= 2;
}

export function showValidationError(field, message) {
    const input = document.getElementById(field);
    if (input) {
        // Удаляем предыдущее сообщение об ошибке, если есть
        const existingError = input.parentElement?.querySelector('.error-message');
        if (existingError) existingError.remove();

        const errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.style.color = '#e53e3e';
        errorSpan.style.fontSize = '12px';
        errorSpan.style.display = 'block';
        errorSpan.style.marginTop = '5px';
        errorSpan.style.marginBottom = '10px';
        errorSpan.innerText = message;

        input.insertAdjacentElement('afterend', errorSpan);

        // Автоматически скрываем через 3 секунды
        setTimeout(() => {
            if (errorSpan.parentElement) {
                errorSpan.remove();
            }
        }, 3000);
    }
}