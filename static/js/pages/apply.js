import { showLoading, hideLoading, showError, showNotification } from '../modules/ui.js';

export async function renderApply() {
    const user = window.currentUser;

    if (user && user.role === 'admin') {
        document.getElementById('app').innerHTML = `
            <div class="form-container">
                <h2>Доступ запрещён</h2>
                <p>Администратор не может записываться на курсы.</p>
                <a href="/courses" class="btn">Вернуться к курсам</a>
            </div>
        `;
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="apply-container">
            <h2>Запись на курс</h2>
            <div class="apply-card">
                <div id="courseSelectContainer"></div>
                <button id="submitApply" class="btn-submit">Записаться</button>
                <div id="applyResult"></div>
            </div>
        </div>
    `;

    await loadCoursesForSelect();
}

async function loadCoursesForSelect() {
    const container = document.getElementById('courseSelectContainer');
    if (!container) return;

    container.innerHTML = '<div class="loader">Загрузка курсов...</div>';

    try {
        const res = await fetch('/api/courses');

        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();

        let courses = [];
        if (Array.isArray(data)) {
            courses = data;
        } else if (data.courses && Array.isArray(data.courses)) {
            courses = data.courses;
        } else {
            throw new Error('Неверный формат данных');
        }

        if (courses.length === 0) {
            container.innerHTML = '<div class="error-message">Курсы не найдены. Перейдите на /seed</div>';
            return;
        }

        container.innerHTML = `
            <label class="course-label">Выберите курс:</label>
            <select id="courseSelect" class="course-select">
                <option value="">-- Выберите курс --</option>
                ${courses.map(c => `<option value="${c.id}">${c.title} - ${c.price} BYN (${c.duration})</option>`).join('')}
            </select>
        `;

        // После создания select проверяем, есть ли course_id в URL
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedCourseId = urlParams.get('course_id');
        const select = document.getElementById('courseSelect');
        if (preselectedCourseId && select) {
            select.value = preselectedCourseId;
        }

        // Привязываем обработчик к кнопке
        const submitBtn = document.getElementById('submitApply');
        if (submitBtn) {
            submitBtn.onclick = async () => {
                const courseId = document.getElementById('courseSelect')?.value;
                if (!courseId) {
                    showNotification('Выберите курс', 'error');
                    return;
                }

                const resultDiv = document.getElementById('applyResult');

                const resApply = await fetch('/api/applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ course_id: courseId })
                });
                const dataApply = await resApply.json();

                if (dataApply.success) {
                    resultDiv.innerHTML = '<div class="message-success">✅ Заявка успешно подана!</div>';
                    showNotification('Заявка подана', 'success');
                    setTimeout(() => {
                        window.location.href = '/profile';
                    }, 1500);
                } else {
                    resultDiv.innerHTML = `<div class="message-error">❌ ${dataApply.message}</div>`;
                    showNotification(dataApply.message, 'error');
                    setTimeout(() => {
                        resultDiv.innerHTML = '';
                    }, 3000);
                }
            };
        }

    } catch (error) {
        console.error('Ошибка:', error);
        container.innerHTML = '<div class="error-message">❌ Ошибка загрузки курсов</div>';
        showError('Ошибка загрузки курсов');
    }
}