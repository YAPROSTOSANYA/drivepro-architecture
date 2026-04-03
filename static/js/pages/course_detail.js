import { showLoading, hideLoading, showError, showNotification } from '../modules/ui.js';

export async function renderCourseDetail(courseId) {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="course-detail-container">
            <button id="backBtn" class="btn-back">← Назад к курсам</button>
            <div id="course-detail" class="course-detail-content"></div>
            <button id="applyBtn" class="btn btn-primary">Записаться на курс</button>
        </div>
    `;

    document.getElementById('backBtn').onclick = () => {
        window.location.href = '/courses';
    };

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
            <div class="course-detail-card">
                <h2>${escapeHtml(course.title)}</h2>
                <p class="course-description">${escapeHtml(course.description)}</p>
                <div class="course-info">
                    <p><span class="info-label">💰 Цена:</span> <span class="info-value">${course.price} BYN</span></p>
                    <p><span class="info-label">⏱ Длительность:</span> <span class="info-value">${course.duration}</span></p>
                    <p><span class="info-label">📚 Категория:</span> <span class="info-value">${course.category}</span></p>
                </div>
            </div>
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