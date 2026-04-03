import { showLoading, hideLoading, showError } from '../modules/ui.js';

let allCourses = [];
let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let currentCategory = '';
let currentPriceRange = '';

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
                    <option value="0-1000">до 1000 BYN</option>
                    <option value="1000-1500">1000 - 1500 BYN</option>
                    <option value="1500-2000">1500 - 2000 BYN</option>
                </select>

                <button id="searchBtn">Найти</button>
            </div>

            <div id="courses-list" class="courses-grid"></div>

            <div class="pagination" id="pagination"></div>
        </div>
    `;

    await loadCourses();

    document.getElementById('searchBtn').addEventListener('click', () => {
        currentPage = 1;
        filterCourses();
    });
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            currentPage = 1;
            filterCourses();
        }
    });
    document.getElementById('categoryFilter').addEventListener('change', () => {
        currentPage = 1;
        filterCourses();
    });
    document.getElementById('priceFilter').addEventListener('change', () => {
        currentPage = 1;
        filterCourses();
    });
}

async function loadCourses() {
    const container = document.getElementById('courses-list');
    if (!container) return;

    showLoading('courses-list');

    try {
        let url = `/api/courses?page=${currentPage}&per_page=6`;
        if (currentSearch) url += `&search=${encodeURIComponent(currentSearch)}`;
        if (currentCategory) url += `&category=${currentCategory}`;
        if (currentPriceRange) url += `&price_range=${currentPriceRange}`;

        const res = await fetch(url);
        const data = await res.json();

        allCourses = data.courses || [];
        totalPages = data.pages || 1;

        hideLoading('courses-list');
        displayCourses(allCourses);
        renderPagination();
    } catch (error) {
        hideLoading('courses-list');
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

    container.innerHTML = courses.map(course => `
        <div class="course-card" data-id="${course.id}">
            <h3>${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.description)}</p>
            <p>💰 Цена: ${course.price} BYN</p>
            <p>⏱ Длительность: ${course.duration}</p>
            <p>📚 Категория: ${course.category}</p>
            <a href="/courses/${course.id}" class="btn">Подробнее</a>
        </div>
    `).join('');
}

function renderPagination() {
    const paginationDiv = document.getElementById('pagination');
    if (!paginationDiv) return;

    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }

    let html = '<div class="pagination-controls">';

    if (currentPage > 1) {
        html += `<button class="page-btn" data-page="${currentPage - 1}">◀ Назад</button>`;
    }

    html += `<span class="page-info">Страница ${currentPage} из ${totalPages}</span>`;

    if (currentPage < totalPages) {
        html += `<button class="page-btn" data-page="${currentPage + 1}">Вперед ▶</button>`;
    }

    html += '</div>';
    paginationDiv.innerHTML = html;

    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentPage = parseInt(btn.dataset.page);
            loadCourses();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

function filterCourses() {
    currentSearch = document.getElementById('searchInput').value.toLowerCase();
    currentCategory = document.getElementById('categoryFilter').value;
    currentPriceRange = document.getElementById('priceFilter').value;
    loadCourses();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}