// ----------------------------
// API URL
// ----------------------------
const API = "http://127.0.0.1:5000/api/auth";

// ----------------------------
// Работа с токеном
// ----------------------------
function saveToken(token) {
    localStorage.setItem("token", token);
}

function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    console.log("Вы вышли из системы");
}

// ----------------------------
// AUTH API
// ----------------------------
async function register(email, name, password) {
    const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, name, password})
    });
    return res.json();
}

async function login(email, password) {
    const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
    });
    return res.json();
}

async function getProfile() {
    const token = getToken();
    const res = await fetch(`${API}/me`, {
        headers: { "Authorization": token }
    });
    return res.json();
}

// ----------------------------
// “Страницы” (логика)
// ----------------------------

// /auth/register
async function pageRegister() {
    console.log("=== Страница регистрации ===");

    const data = await register("new@test.com", "Саня", "12345");
    console.log(data);

    console.log("Переход на /auth/login...");
    await pageLogin();
}

// /auth/login
async function pageLogin() {
    console.log("=== Страница логина ===");

    const data = await login("new@test.com", "12345");
    console.log(data);

    if (data.token) {
        saveToken(data.token);
        console.log("Успешный вход → переход на /profile");
        await pageProfile();
    }
}

// /profile (приватная)
async function pageProfile() {
    console.log("=== Приватная страница /profile ===");

    const token = getToken();

    if (!token) {
        console.log("Нет токена → редирект на /auth/login");
        return pageLogin();
    }

    const profile = await getProfile();
    console.log("Данные пользователя:", profile);
}

// ----------------------------
// Запуск приложения
// ----------------------------
(async () => {
    // имитируем переход на страницу регистрации
    await pageRegister();
})();