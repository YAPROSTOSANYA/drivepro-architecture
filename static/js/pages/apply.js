import { showLoading, showError } from '../modules/ui.js';

export async function renderApply() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="apply-container">
            <h2>Запись на курс</h2>
            <select id="courseSelect"></select>
            <button id="submitApply">Записаться</button>
            <div id="applyResult"></div>
        </div>
    `;

    await loadCoursesForSelect();

    document.getElementById('submitApply').onclick = async () => {
        const courseId = document.getElementById('courseSelect').value;
        if (!courseId) {
            alert('Выберите курс');
            return;
        }

        const res = await fetch('/api/applications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId })
        });
        const data = await res.json();

        const resultDiv = document.getElementById('applyResult');
        if (data.success) {
            resultDiv.innerHTML = '<p class="success">Заявка подана!</p>';
        } else {
            resultDiv.innerHTML = `<p class="error">${data.message}</p>`;
        }
    };
}

async function loadCoursesForSelect() {
    const select = document.getElementById('courseSelect');
    if (!select) return;

    showLoading('courseSelect');

    try {
        const res = await fetch('/api/courses');
        const courses = await res.json();

        select.innerHTML = '<option value="">Выберите курс</option>' +
            courses.map(c => `<option value="${c.id}">${c.title} - ${c.price} руб.</option>`).join('');
    } catch (error) {
        showError('Ошибка загрузки курсов');
    }
}