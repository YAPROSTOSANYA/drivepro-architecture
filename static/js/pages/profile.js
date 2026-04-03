import { showNotification } from '../modules/ui.js';

export async function renderProfile() {
    const app = document.getElementById('app');
    const user = window.currentUser;

    const res = await fetch('/api/applications');
    const applications = await res.json();

    app.innerHTML = `
        <div class="profile-container">
            <div class="profile-header">
                <h1>Личный кабинет</h1>
                <p>Добро пожаловать, ${escapeHtml(user?.name || '')}!</p>
            </div>

            <div class="profile-info">
                <h2>Мои данные</h2>
                <div class="info-card">
                    <p><strong>Имя:</strong> ${escapeHtml(user?.name || '')}</p>
                    <p><strong>Email:</strong> ${escapeHtml(user?.email || '')}</p>
                    <p><strong>Дата регистрации:</strong> ${user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</p>
                </div>
            </div>

            <div class="profile-applications">
                <h2>Мои заявки на курсы</h2>
                <div id="applications-list" class="applications-grid">
                    ${renderApplicationsList(applications)}
                </div>
            </div>
        </div>
    `;

    // Добавляем обработчики для кнопок отмены
    document.querySelectorAll('.cancel-application-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const applicationId = btn.dataset.id;
            if (confirm('Отменить заявку?')) {
                const res = await fetch(`/api/applications/${applicationId}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showNotification('Заявка отменена', 'success');
                    renderProfile(); // Обновляем страницу
                } else {
                    showNotification(data.message, 'error');
                }
            }
        });
    });
}

function renderApplicationsList(applications) {
    if (!applications || applications.length === 0) {
        return '<p>У вас пока нет заявок. Перейдите на <a href="/courses">страницу курсов</a> чтобы записаться.</p>';
    }

    return applications.map(app => `
        <div class="application-card">
            <p><strong>Курс ID:</strong> ${app.course_id}</p>
            <p><strong>Статус:</strong> <span class="status-${app.status}">${app.status === 'pending' ? 'На рассмотрении' : app.status}</span></p>
            <p><strong>Дата подачи:</strong> ${new Date(app.created_at).toLocaleDateString()}</p>
            <button class="btn cancel-application-btn" data-id="${app.id}">Отменить заявку</button>
        </div>
    `).join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}