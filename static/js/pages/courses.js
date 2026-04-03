import { showLoading, showError } from '../modules/ui.js';

export async function renderCourses() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="courses-container">
            <h2>Наши курсы</h2>
            <div id="courses-list" class="courses-grid"></div>
        </div>
    `;

    await loadCourses();
}

async function loadCourses() {
    const container = document.getElementById('courses-list');
    if (!container) return;

    showLoading('courses-list');

    try {
        const res = await fetch('/api/courses');
        const courses = await res.json();

        if (courses.length === 0) {
            container.innerHTML = '<p>Курсов пока нет</p>';
            return;
        }

        container.innerHTML = courses.map(course => `
            <div class="course-card">
                <h3>${escapeHtml(course.title)}</h3>
                <p>${escapeHtml(course.description)}</p>
                <p>Цена: ${course.price} руб.</p>
                <p>Длительность: ${course.duration}</p>
                <a href="/courses/${course.id}">Подробнее</a>
            </div>
        `).join('');
    } catch (error) {
        showError('Ошибка загрузки курсов');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}