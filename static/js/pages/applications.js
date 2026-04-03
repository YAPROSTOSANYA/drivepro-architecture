import { showLoading, showError } from '../modules/ui.js';

export async function renderApplications() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="applications-container">
            <h2>Мои заявки</h2>
            <div id="applications-list"></div>
        </div>
    `;

    await loadApplications();
}

async function loadApplications() {
    const container = document.getElementById('applications-list');
    if (!container) return;

    showLoading('applications-list');

    try {
        const res = await fetch('/api/applications');
        const apps = await res.json();

        if (apps.length === 0) {
            container.innerHTML = '<p>У вас пока нет заявок</p>';
            return;
        }

        container.innerHTML = apps.map(app => `
            <div class="application-card">
                <p>Курс ID: ${app.course_id}</p>
                <p>Статус: ${app.status}</p>
                <p>Дата: ${new Date(app.created_at).toLocaleDateString()}</p>
            </div>
        `).join('');
    } catch (error) {
        showError('Ошибка загрузки заявок');
    }
}