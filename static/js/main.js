import { router, setRenderFunctions } from './modules/router.js';
import { checkAuth } from './modules/auth.js';
import { validateEmail, validatePassword, validateName, showValidationError } from './modules/auth.js';
import { showLoading } from './modules/ui.js';

// Функции рендера (старые, для cabinet, login, register)
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

// Передаём функции в router
setRenderFunctions(renderLogin, renderRegister, renderCabinet);

// Функции для работы с items (старые, временно)
async function loadItems() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch('/api/items', {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        const itemsDiv = document.getElementById('items');
        if (itemsDiv && data.items) {
            itemsDiv.innerHTML = data.items.map(item => `
                <div class="item-card">
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <button onclick="deleteItem(${item.id})">Удалить</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Load items error', error);
    }
}

async function addItem() {
    const title = document.getElementById('title')?.value;
    const description = document.getElementById('description')?.value;
    if (!title) return;

    const token = localStorage.getItem('token');
    await fetch('/api/items', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ title, description })
    });
    loadItems();
}

async function deleteItem(id) {
    const token = localStorage.getItem('token');
    await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    loadItems();
}

window.login = async function() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    if (!email || !password) {
        alert('Заполните все поля');
        return;
    }

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
        window.location.href = '/cabinet';
    } else {
        alert(data.message);
    }
};

window.register = async function() {
    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;

    // Валидация
    let isValid = true;

    if (!validateName(name)) {
        showValidationError('name', 'Имя должно содержать минимум 2 символа');
        isValid = false;
    }

    if (!validateEmail(email)) {
        showValidationError('email', 'Введите корректный email');
        isValid = false;
    }

    if (!validatePassword(password)) {
        showValidationError('password', 'Пароль должен содержать минимум 6 символов, включая буквы и цифры');
        isValid = false;
    }

    if (!isValid) return;

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    alert(data.message);
    if (data.success) {
        window.location.href = '/auth/login';
    }
};

window.addItem = addItem;
window.deleteItem = deleteItem;

// Запуск приложения
showLoading();
checkAuth().then(() => {
    router();
});