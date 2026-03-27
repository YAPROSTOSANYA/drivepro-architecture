const app = document.getElementById("app");

// Рендер страниц
function renderLogin() {
    app.innerHTML = `
        <div class="form-container">
            <h2>Вход</h2>
            <input type="email" id="email" placeholder="Email">
            <input type="password" id="password" placeholder="Пароль">
            <button onclick="login()">Войти</button>
            <p>Нет аккаунта? <a href="/register">Регистрация</a></p>
        </div>
    `;
}

function renderRegister() {
    app.innerHTML = `
        <div class="form-container">
            <h2>Регистрация</h2>
            <input type="text" id="name" placeholder="Имя">
            <input type="email" id="email" placeholder="Email">
            <input type="password" id="password" placeholder="Пароль">
            <button onclick="register()">Зарегистрироваться</button>
            <p>Уже есть аккаунт? <a href="/">Вход</a></p>
        </div>
    `;
}

function renderCabinet() {
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

            <button onclick="logout()" class="logout-btn">Выйти</button>
        </div>
    `;
    loadItems();
}

// Определяем какая страница загружена
if (window.PAGE === "login") renderLogin();
if (window.PAGE === "register") renderRegister();
if (window.PAGE === "cabinet") renderCabinet();

// Регистрация
async function register() {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!name || !email || !password) {
        alert("Заполните все поля");
        return;
    }

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(data.message);
            window.location.href = "/";
        } else {
            alert(data.message || "Ошибка регистрации");
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка соединения с сервером");
    }
}

// Вход
async function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Заполните все поля");
        return;
    }

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(data.message);
            window.location.href = "/cabinet";
        } else {
            alert(data.message || "Ошибка входа");
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка соединения с сервером");
    }
}

// Загрузка элементов
async function loadItems() {
    try {
        const response = await fetch("/api/items");

        if (response.status === 401) {
            window.location.href = "/";
            return;
        }

        const data = await response.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

        const itemsDiv = document.getElementById("items");
        if (!itemsDiv) return;

        if (data.items.length === 0) {
            itemsDiv.innerHTML = '<p>Нет элементов. Добавьте первый!</p>';
            return;
        }

        itemsDiv.innerHTML = data.items.map(item => `
            <div class="item-card">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.description)}</p>
                <button onclick="deleteItem(${item.id})" class="delete-btn">Удалить</button>
            </div>
        `).join("");

    } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка загрузки элементов");
    }
}

// Добавление элемента
async function addItem() {
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;

    if (!title) {
        alert("Введите название");
        return;
    }

    try {
        const response = await fetch("/api/items", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, description })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            document.getElementById("title").value = "";
            document.getElementById("description").value = "";
            loadItems();
        } else {
            alert(data.message || "Ошибка добавления");
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка добавления");
    }
}

// Удаление элемента
async function deleteItem(id) {
    if (!confirm("Удалить этот элемент?")) return;

    try {
        const response = await fetch(`/api/items/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.ok && data.success) {
            loadItems();
        } else {
            alert(data.message || "Ошибка удаления");
        }
    } catch (error) {
        console.error("Ошибка:", error);
        alert("Ошибка удаления");
    }
}

// Выход
async function logout() {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/";
    } catch (error) {
        console.error("Ошибка:", error);
        window.location.href = "/";
    }
}

// Защита от XSS
function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}