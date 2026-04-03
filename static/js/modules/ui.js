export function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const existingLoader = container.querySelector('.loader');
        if (!existingLoader) {
            container.innerHTML = '<div class="loader">Загрузка...</div>' + (container.innerHTML || '');
        }
    }
}

export function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const loader = container.querySelector('.loader');
        if (loader) loader.remove();
    }
}

export function showError(message) {
    showNotification(message, 'error');
}

export function showSuccess(message) {
    showNotification(message, 'success');
}

export function showNotification(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <button class="toast-close">&times;</button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);

    notification.querySelector('.toast-close').onclick = () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    };

    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }
    }, 4000);
}

export function renderNav(user) {
    const nav = document.getElementById('nav');
    if (!nav) return;

    if (user) {
        nav.innerHTML = `
            <a href="/">Главная</a>
            <a href="/about">О школе</a>
            <a href="/courses">Курсы</a>
            <a href="/profile">Профиль</a>
            <a href="/apply">Записаться</a>
            ${user.email === 'admin@example.com' ? '<a href="/admin">Админ</a>' : ''}
            <span>Привет, ${user.name}</span>
            <button onclick="window.logout()">Выйти</button>
        `;
    } else {
        nav.innerHTML = `
            <a href="/">Главная</a>
            <a href="/about">О школе</a>
            <a href="/courses">Курсы</a>
            <a href="/auth/login">Войти</a>
            <a href="/auth/register">Регистрация</a>
        `;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}