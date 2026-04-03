import { checkAuth } from './auth.js';
import { renderHome } from '../pages/home.js';
import { renderAbout } from '../pages/about.js';
import { renderLogin, renderRegister, renderCabinet } from '../main.js';

const publicRoutes = ['/', '/about', '/auth/login', '/auth/register'];
const privateRoutes = ['/cabinet', '/profile', '/applications', '/apply', '/admin'];

export async function router() {
    const path = window.location.pathname;
    const user = await checkAuth();

    // Проверка приватных маршрутов
    if (privateRoutes.some(route => path.startsWith(route)) && !user) {
        window.location.href = '/auth/login';
        return;
    }

    // Рендер страниц
    if (path === '/') {
        renderHome();
    } else if (path === '/about') {
        renderAbout();
    } else if (path === '/auth/login') {
        renderLogin();
    } else if (path === '/auth/register') {
        renderRegister();
    } else if (path === '/cabinet') {
        renderCabinet();
    } else {
        document.getElementById('app').innerHTML = '<h2>404 - Страница не найдена</h2>';
    }
}

// Обработка кликов по ссылкам
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('/')) {
        e.preventDefault();
        const href = link.getAttribute('href');
        window.history.pushState({}, '', href);
        router();
    }
});

window.addEventListener('popstate', router);