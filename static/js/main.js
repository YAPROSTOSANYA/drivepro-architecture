// ----------------------------
// Пользователи
// ----------------------------
async function registerUser(name, email, password) {
    const res = await fetch("http://127.0.0.1:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    console.log("Регистрация:", data);
    return data;
}

async function loginUser(email, password) {
    const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    console.log("Логин:", data);
    return data;
}

async function getProfile(token) {
    const res = await fetch("http://127.0.0.1:5000/api/auth/me", {
        headers: { "Authorization": token }
    });
    const data = await res.json();
    console.log("Профиль:", data);
    return data;
}

// ----------------------------
// Item
// ----------------------------
async function createItem(title, description, token) {
    const res = await fetch("http://127.0.0.1:5000/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ title, description })
    });
    const data = await res.json();
    console.log("Создан Item:", data);
}

async function getItems() {
    const res = await fetch("http://127.0.0.1:5000/api/items");
    const data = await res.json();
    console.log("Список Item:", data);
    return data;
}

// ----------------------------
// Пример использования
// ----------------------------
(async () => {
    const reg = await registerUser("Саня", "item@test.com", "12345");
    const loginData = await loginUser("item@test.com", "12345");
    if (loginData.token) {
        await createItem("Моя первая запись", "Описание записи", loginData.token);
        await getItems();
        await getProfile(loginData.token);
    }
})();