// Вспомогательные функции для UI

export function showLoading() {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = '<div class="loader">Загрузка...</div>';
    }
}

export function showError(message) {
    alert(message);
}

export function renderNav(user) {
    const nav = document.getElementById('nav');
    if (!nav) return;

    if (user) {
        nav.innerHTML = `
            <a href="/">Главная</a>
            <a href="/about">О школе</a>
            <a href="/courses">Курсы</a>
            <a href="/cabinet">Кабинет</a>
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