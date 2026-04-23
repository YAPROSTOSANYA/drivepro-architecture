import { checkAuth } from './auth.js';
import { renderHome } from '../pages/home.js';
import { renderAbout } from '../pages/about.js';
import { renderCourses } from '../pages/courses.js';
import { renderCourseDetail } from '../pages/course_detail.js';
import { renderProfile } from '../pages/profile.js';
import { renderApply } from '../pages/apply.js';
import { renderAdmin } from '../pages/admin.js';
import { renderForgotPassword, renderResetPassword, renderLogin, renderRegister, renderCabinet } from '../main.js';

let renderLoginFunc, renderRegisterFunc, renderCabinetFunc;

export function setRenderFunctions(login, register, cabinet) {
    renderLoginFunc = login;
    renderRegisterFunc = register;
    renderCabinetFunc = cabinet;
}

const publicRoutes = ['/', '/about', '/courses', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
const privateRoutes = ['/profile', '/apply', '/admin'];

export async function router() {
    const path = window.location.pathname;
    const user = await checkAuth();

    if (privateRoutes.some(route => path.startsWith(route)) && !user) {
        window.location.href = '/auth/login';
        return;
    }

    if (path === '/' || path === '') {
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
    } else if (path === '/apply') {
        renderApply();
    } else if (path === '/admin') {
        renderAdmin();
    } else if (path === '/auth/login') {
        if (renderLoginFunc) renderLoginFunc();
    } else if (path === '/auth/register') {
        if (renderRegisterFunc) renderRegisterFunc();
    } else if (path === '/auth/forgot-password') {
        if (renderForgotPassword) renderForgotPassword();
    } else if (path === '/auth/reset-password') {
        if (renderResetPassword) renderResetPassword();
    } else if (path === '/cabinet') {
        if (renderCabinetFunc) renderCabinetFunc();
    } else {
        document.getElementById('app').innerHTML = '<h2>404 - Страница не найдена</h2>';
    }
}

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