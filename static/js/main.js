const API_URL = "http://127.0.0.1:5000/api/auth";

// Регистрация пользователя
async function registerUser(name, email, password) {
    const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    console.log("Регистрация:", data);
    return data;
}

// Логин пользователя
async function loginUser(email, password) {
    const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log("Логин:", data);
    return data;
}

// Получение приватного профиля
async function getProfile(token) {
    const res = await fetch(`${API_URL}/me`, {
        method: "GET",
        headers: { "Authorization": token }
    });
    const data = await res.json();
    console.log("Профиль:", data);
    return data;
}

// Пример использования
(async () => {
    // 1. Регистрация
    await registerUser("Саня", "test@example.com", "12345");

    // 2. Логин
    const loginData = await loginUser("test@example.com", "12345");

    // 3. Получение профиля (если логин успешен)
    if (loginData.token) {
        await getProfile(loginData.token);
    }
})();