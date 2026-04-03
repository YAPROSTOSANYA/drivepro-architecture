import { showLoading, hideLoading, showError, showNotification } from '../modules/ui.js';

export async function renderCourseDetail(courseId) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="course-detail-container">
            <div id="course-detail"></div>
            <button id="applyBtn" class="btn">Записаться на курс</button>
        </div>
    `;

    await loadCourseDetail(courseId);

    const applyBtn = document.getElementById('applyBtn');
    if (applyBtn) {
        applyBtn.onclick = async () => {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_id: courseId })
            });
            const data = await res.json();
            if (data.success) {
                showNotification('Заявка подана', 'success');
            } else {
                showNotification(data.message, 'error');
            }
        };
    }
}

async function loadCourseDetail(courseId) {
    const container = document.getElementById('course-detail');
    if (!container) return;

    showLoading('course-detail');

    try {
        const res = await fetch(`/api/courses/${courseId}`);
        const course = await res.json();

        hideLoading('course-detail');

        container.innerHTML = `
            <h2>${escapeHtml(course.title)}</h2>
            <p>${escapeHtml(course.description)}</p>
            <p>💰 Цена: ${course.price} BYN</p>
            <p>⏱ Длительность: ${course.duration}</p>
            <p>📚 Категория: ${course.category}</p>
        `;
    } catch (error) {
        hideLoading('course-detail');
        showError('Ошибка загрузки курса');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}