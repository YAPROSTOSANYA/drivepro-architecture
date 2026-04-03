import { router, setRenderFunctions } from './modules/router.js';
import { checkAuth } from './modules/auth.js';
import { validateEmail, validatePassword, validateName, showValidationError } from './modules/auth.js';
import { showLoading, showNotification } from './modules/ui.js';

export function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="form-container">
            <h2>Вход</h2>
            <input type="email" id="email" placeholder="Email">
            <input type="password" id="password" placeholder="Пароль">
            <label>
                <input type="checkbox" id="remember_me"> Запомнить пароль
            </label>
            <button onclick="login()">Войти</button>
            <p><a href="#" id="forgotPasswordLink">Забыли пароль?</a></p>
            <p>Нет аккаунта? <a href="/auth/register">Регистрация</a></p>
        </div>
    `;

    document.getElementById('forgotPasswordLink').onclick = (e) => {
        e.preventDefault();
        showForgotPasswordModal();
    };
}

function showForgotPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h2>Восстановление пароля</h2>
            <input type="email" id="modal_reset_email" placeholder="Email">
            <button id="modal_send_reset">Отправить ссылку</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    modal.querySelector('.modal-close').onclick = () => {
        modal.remove();
    };

    modal.querySelector('#modal_send_reset').onclick = async () => {
        const email = document.getElementById('modal_reset_email').value;
        if (!email) {
            showNotification('Введите email', 'error');
            return;
        }

        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();

        if (data.success) {
            showNotification(data.message, 'success');
            if (data.reset_token) {
                showNotification(`Ваш токен для сброса: ${data.reset_token}`, 'info');
            }
            modal.remove();
        } else {
            showNotification(data.message, 'error');
        }
    };
}

export function renderRegister() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="form-container">
            <h2>Регистрация</h2>
            <div class="input-group">
                <input type="text" id="name" placeholder="Имя">
                <div id="name-error" class="error-container"></div>
            </div>
            <div class="input-group">
                <input type="email" id="email" placeholder="Email">
                <div id="email-error" class="error-container"></div>
            </div>
            <div class="input-group">
                <input type="password" id="password" placeholder="Пароль">
                <div id="password-error" class="error-container"></div>
            </div>
            <div class="input-group">
                <input type="password" id="confirm_password" placeholder="Подтвердите пароль">
                <div id="confirm_password-error" class="error-container"></div>
            </div>
            <div id="password-strength" class="password-strength"></div>
            <div id="password-hint" class="password-hint"></div>
            <button onclick="register()">Зарегистрироваться</button>
            <p>Уже есть аккаунт? <a href="/auth/login">Вход</a></p>
        </div>
    `;

    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
}

export function renderForgotPassword() {
    // Удаляем старую страницу восстановления, используем модальное окно
}

export function renderResetPassword() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        document.getElementById('app').innerHTML = '<div class="form-container"><h2>Ошибка</h2><p>Неверная ссылка для сброса пароля</p><a href="/auth/login">Вернуться ко входу</a></div>';
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="form-container">
            <h2>Сброс пароля</h2>
            <input type="password" id="new_password" placeholder="Новый пароль">
            <input type="password" id="confirm_password" placeholder="Подтвердите пароль">
            <div id="password-strength" class="password-strength"></div>
            <button onclick="resetPassword('${token}')">Сменить пароль</button>
        </div>
    `;

    const passwordInput = document.getElementById('new_password');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrengthReset);
    }
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

setRenderFunctions(renderLogin, renderRegister, renderCabinet);

function checkPasswordStrength() {
    const password = document.getElementById('password')?.value || '';
    const strengthDiv = document.getElementById('password-strength');
    const hintDiv = document.getElementById('password-hint');
    if (!strengthDiv) return;

    if (password.length === 0) {
        strengthDiv.textContent = '';
        if (hintDiv) hintDiv.textContent = '';
        return;
    }

    let strength = 0;
    let hints = [];

    if (password.length >= 6) {
        strength++;
    } else {
        hints.push('• минимум 6 символов');
    }

    if (password.match(/[A-Z]/)) {
        strength++;
    } else {
        hints.push('• хотя бы одну заглавную букву (A-Z)');
    }

    if (password.match(/[a-z]/)) {
        strength++;
    } else {
        hints.push('• хотя бы одну строчную букву (a-z)');
    }

    if (password.match(/[0-9]/)) {
        strength++;
    } else {
        hints.push('• хотя бы одну цифру');
    }

    if (password.match(/[@$!%*?&]/)) {
        strength++;
    } else {
        hints.push('• хотя бы один спецсимвол (@$!%*?&)');
    }

    const messages = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Сильный'];
    const colors = ['#e53e3e', '#ed8936', '#ecc94b', '#48bb78', '#38a169'];

    if (strength <= 2) {
        strengthDiv.textContent = messages[0];
        strengthDiv.style.color = colors[0];
    } else {
        const index = Math.min(strength - 2, messages.length - 1);
        strengthDiv.textContent = messages[index];
        strengthDiv.style.color = colors[index];
    }

    if (hintDiv && hints.length > 0 && strength < 5) {
        hintDiv.innerHTML = '<small>Пароль должен содержать:</small><br>' + hints.join('<br>');
        hintDiv.style.color = '#666';
        hintDiv.style.fontSize = '12px';
        hintDiv.style.marginTop = '-10px';
        hintDiv.style.marginBottom = '10px';
    } else if (hintDiv) {
        hintDiv.innerHTML = '';
    }
}

function checkPasswordStrengthReset() {
    const password = document.getElementById('new_password')?.value || '';
    const strengthDiv = document.getElementById('password-strength');
    if (!strengthDiv) return;

    if (password.length === 0) {
        strengthDiv.textContent = '';
        return;
    }

    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[@$!%*?&]/)) strength++;

    const messages = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Сильный'];
    const colors = ['#e53e3e', '#ed8936', '#ecc94b', '#48bb78', '#38a169'];

    if (strength <= 2) {
        strengthDiv.textContent = messages[0];
        strengthDiv.style.color = colors[0];
    } else {
        const index = Math.min(strength - 2, messages.length - 1);
        strengthDiv.textContent = messages[index];
        strengthDiv.style.color = colors[index];
    }
}

async function loadItems() {
    try {
        const res = await fetch('/api/items');
        const data = await res.json();
        const itemsDiv = document.getElementById('items');
        if (itemsDiv && data.items) {
            itemsDiv.innerHTML = data.items.map(item => `
                <div class="item-card">
                    <h3>${escapeHtml(item.title)}</h3>
                    <p>${escapeHtml(item.description)}</p>
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

    await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
    });
    loadItems();
}

async function deleteItem(id) {
    await fetch(`/api/items/${id}`, { method: 'DELETE' });
    loadItems();
}

window.login = async function() {
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const rememberMe = document.getElementById('remember_me')?.checked || false;

    if (!email || !password) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember_me: rememberMe })
    });
    const data = await res.json();

    if (data.success) {
        window.location.href = '/profile';
    } else {
        showNotification(data.message, 'error');
    }
};

window.register = async function() {
    const name = document.getElementById('name')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirm_password')?.value;

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
        showValidationError('password', 'Пароль должен содержать минимум 6 символов, заглавную и строчную буквы, цифру и спецсимвол (@$!%*?&)');
        isValid = false;
    }

    if (password !== confirmPassword) {
        showValidationError('confirm_password', 'Пароли не совпадают');
        isValid = false;
    }

    if (!isValid) return;

    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    showNotification(data.message, data.success ? 'success' : 'error');
    if (data.success) {
        window.location.href = '/auth/login';
    }
};

window.sendResetLink = async function() {
    const email = document.getElementById('reset_email')?.value;

    if (!email) {
        showNotification('Введите email', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showNotification('Введите корректный email', 'error');
        return;
    }

    const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (data.success) {
        showNotification(data.message, 'success');
        if (data.reset_token) {
            showNotification(`Ваш токен для сброса: ${data.reset_token}. Перейдите на страницу /auth/reset-password?token=${data.reset_token}`, 'info');
        }
    } else {
        showNotification(data.message, 'error');
    }
};

window.resetPassword = async function(token) {
    const newPassword = document.getElementById('new_password')?.value;
    const confirmPassword = document.getElementById('confirm_password')?.value;

    if (!newPassword || !confirmPassword) {
        showNotification('Заполните все поля', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }

    if (!validatePassword(newPassword)) {
        showNotification('Пароль должен содержать минимум 6 символов, заглавную и строчную буквы, цифру и спецсимвол (@$!%*?&)', 'error');
        return;
    }

    const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: token, new_password: newPassword })
    });
    const data = await res.json();
    showNotification(data.message, data.success ? 'success' : 'error');
    if (data.success) {
        window.location.href = '/auth/login';
    }
};

window.addItem = addItem;
window.deleteItem = deleteItem;

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

showLoading();
checkAuth().then(() => {
    router();
});