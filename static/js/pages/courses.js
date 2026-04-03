import { showLoading, showError } from '../modules/ui.js';

let allCourses = [];

export async function renderCourses() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="courses-container">
            <h2>Наши курсы</h2>

            <div class="filters">
                <input type="text" id="searchInput" placeholder="Поиск по названию...">

                <select id="categoryFilter">
                    <option value="">Все категории</option>
                    <option value="basic">Базовые</option>
                    <option value="moto">Мото</option>
                    <option value="truck">Грузовые</option>
                    <option value="bus">Автобусы</option>
                </select>

                <select id="priceFilter">
                    <option value="">Любая цена</option>
                    <option value="0-20000">до 20000 руб.</option>
                    <option value="20000-30000">20000 - 30000 руб.</option>
                    <option value="30000-50000">30000 - 50000 руб.</option>
                </select>

                <button id="searchBtn">Найти</button>
            </div>

            <div id="courses-list" class="courses-grid"></div>
        </div>
    `;

    await loadCourses();

    document.getElementById('searchBtn').addEventListener('click', filterCourses);
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterCourses();
    });
    document.getElementById('categoryFilter').addEventListener('change', filterCourses);
    document.getElementById('priceFilter').addEventListener('change', filterCourses);
}

async function loadCourses() {
    const container = document.getElementById('courses-list');
    if (!container) return;

    showLoading('courses-list');

    try {
        const res = await fetch('/api/courses');
        allCourses = await res.json();
        displayCourses(allCourses);
    } catch (error) {
        showError('Ошибка загрузки курсов');
    }
}

function displayCourses(courses) {
    const container = document.getElementById('courses-list');
    if (!container) return;

    if (courses.length === 0) {
        container.innerHTML = '<p>Курсов не найдено</p>';
        return;
    }

    // Получаем избранное из localStorage
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    container.innerHTML = courses.map(course => `
        <div class="course-card" data-id="${course.id}">
            <h3>${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.description)}</p>
            <p>Цена: ${course.price} руб.</p>
            <p>Длительность: ${course.duration}</p>
            <p>Категория: ${course.category}</p>
            <button class="favorite-btn ${favorites.includes(course.id) ? 'active' : ''}" data-id="${course.id}">
                ${favorites.includes(course.id) ? '★ В избранном' : '☆ В избранное'}
            </button>
            <a href="/courses/${course.id}" class="btn">Подробнее</a>
        </div>
    `).join('');

    // Добавляем обработчики для кнопок избранного
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const courseId = parseInt(btn.dataset.id);
            toggleFavorite(courseId);
        });
    });
}

function filterCourses() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const priceRange = document.getElementById('priceFilter').value;

    let filtered = [...allCourses];

    // Поиск по названию
    if (searchText) {
        filtered = filtered.filter(c => c.title.toLowerCase().includes(searchText));
    }

    // Фильтр по категории
    if (category) {
        filtered = filtered.filter(c => c.category === category);
    }

    // Фильтр по цене
    if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        if (max) {
            filtered = filtered.filter(c => c.price >= min && c.price <= max);
        } else {
            filtered = filtered.filter(c => c.price >= min);
        }
    }

    displayCourses(filtered);
}

function toggleFavorite(courseId) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    if (favorites.includes(courseId)) {
        favorites = favorites.filter(id => id !== courseId);
        alert('Удалено из избранного');
    } else {
        favorites.push(courseId);
        alert('Добавлено в избранное');
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));

    // Обновляем отображение
    filterCourses();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}