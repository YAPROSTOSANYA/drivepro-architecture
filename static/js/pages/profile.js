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

    document.querySelectorAll('.cancel-application-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const applicationId = btn.dataset.id;
            const courseTitle = btn.dataset.title;
            showConfirmModal(applicationId, courseTitle);
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
            <button class="cancel-application-btn" data-id="${app.id}" data-title="Курс ${app.course_id}">Отменить заявку</button>
        </div>
    `).join('');
}

function showConfirmModal(applicationId, courseTitle) {
    const modal = document.createElement('div');
    modal.className = 'modal confirm-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>Подтверждение отмены</h3>
            <p>Вы действительно хотите отменить заявку на "${courseTitle}"?</p>
            <div class="modal-buttons">
                <button class="modal-cancel">Нет, закрыть</button>
                <button class="modal-confirm">Да, отменить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('.modal-cancel').onclick = () => modal.remove();
    modal.querySelector('.modal-confirm').onclick = async () => {
        const res = await fetch(`/api/applications/${applicationId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showNotification('Заявка отменена', 'success');
            renderProfile();
        } else {
            showNotification(data.message, 'error');
        }
        modal.remove();
    };
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}