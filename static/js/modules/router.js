import { checkAuth } from './auth.js';
import { renderHome } from '../pages/home.js';
import { renderAbout } from '../pages/about.js';
import { renderCourses } from '../pages/courses.js';
import { renderCourseDetail } from '../pages/course_detail.js';
import { renderProfile } from '../pages/profile.js';
import { renderApplications } from '../pages/applications.js';
import { renderApply } from '../pages/apply.js';
import { renderAdmin } from '../pages/admin.js';

// Функции из старого main.js (пока оставляем)
let renderLogin, renderRegister, renderCabinet;

export function setRenderFunctions(login, register, cabinet) {
    renderLogin = login;
    renderRegister = register;
    renderCabinet = cabinet;
}

const publicRoutes = ['/', '/about', '/courses', '/auth/login', '/auth/register'];
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
    } else if (path === '/courses') {
        renderCourses();
    } else if (path.startsWith('/courses/')) {
        const courseId = path.split('/')[2];
        renderCourseDetail(courseId);
    } else if (path === '/profile') {
        renderProfile();
    } else if (path === '/applications') {
        renderApplications();
    } else if (path === '/apply') {
        renderApply();
    } else if (path === '/admin') {
        renderAdmin();
    } else if (path === '/auth/login') {
        if (renderLogin) renderLogin();
    } else if (path === '/auth/register') {
        if (renderRegister) renderRegister();
    } else if (path === '/cabinet') {
        if (renderCabinet) renderCabinet();
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