import { router } from './modules/router.js';
import { checkAuth } from './modules/auth.js';
import { showLoading } from './modules/ui.js';

// Старые функции рендера (пока оставляем)
export function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="form-container">
            <h2>Вход</h2>
            <input type="email" id="email" placeholder="Email">
            <input type="password" id="password" placeholder="Пароль">
            <button onclick="login()">Войти</button>
            <p>Нет аккаунта? <a href="/auth/register">Регистрация</a></p>
        </div>
    `;
}

export function renderRegister() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="form-container">
            <h2>Регистрация</h2>
            <input type="text" id="name" placeholder="Имя">
            <input type="email" id="email" placeholder="Email">
            <input type="password" id="password" placeholder="Пароль">
            <button onclick="register()">Зарегистрироваться</button>
            <p>Уже есть аккаунт? <a href="/auth/login">Вход</a></p>
        </div>
    `;
}

export function renderCabinet() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="cabinet-container">
            <h2>Личный кабинет</h2>
            <div class="add-form">
                <h3>Добавить элемент</h3>
                <input type="text" id="title" placeholder="Название">
                <input type="text" id="description" placeholder="Описание">
                <button onclick="addItem()">Добавить</button>
            </div>
            <div class="items-list">
                <h3>Мои элементы</h3>
                <div id="items"></div>
            </div>
        </div>
    `;
    loadItems();
}

// Функции login, register, loadItems, addItem, deleteItem пока оставляем как были
// (перенесём позже в modules)

// Запуск приложения
showLoading();
checkAuth().then(() => {
    router();
});

// Делаем функции глобальными для onclick (временно)
window.login = async function() { /* старая логика */ };
window.register = async function() { /* старая логика */ };
window.addItem = async function() { /* старая логика */ };
window.deleteItem = async function(id) { /* старая логика */ };