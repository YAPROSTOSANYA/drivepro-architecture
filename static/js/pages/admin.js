import { showLoading, showError } from '../modules/ui.js';

export async function renderAdmin() {
    const user = window.currentUser;

    // Простая проверка на админа (по email, можно расширить)
    if (!user || user.email !== 'admin@example.com') {
        document.getElementById('app').innerHTML = '<h2>Доступ запрещен</h2>';
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="admin-container">
            <h2>Админ-панель</h2>
            <h3>Добавить курс</h3>
            <input type="text" id="title" placeholder="Название">
            <textarea id="description" placeholder="Описание"></textarea>
            <input type="number" id="price" placeholder="Цена">
            <input type="text" id="duration" placeholder="Длительность">
            <input type="text" id="category" placeholder="Категория">
            <button id="addCourseBtn">Добавить курс</button>
            <div id="adminResult"></div>
        </div>
    `;

    document.getElementById('addCourseBtn').onclick = async () => {
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const price = document.getElementById('price').value;
        const duration = document.getElementById('duration').value;
        const category = document.getElementById('category').value;

        if (!title) {
            alert('Название обязательно');
            return;
        }

        const res = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, price, duration, category })
        });
        const data = await res.json();

        const resultDiv = document.getElementById('adminResult');
        if (data.success) {
            resultDiv.innerHTML = '<p class="success">Курс добавлен</p>';
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            document.getElementById('price').value = '';
            document.getElementById('duration').value = '';
            document.getElementById('category').value = '';
        } else {
            resultDiv.innerHTML = `<p class="error">${data.message}</p>`;
        }
    };
}