import { showNotification } from '../modules/ui.js';

export async function renderProfile() {
    const app = document.getElementById('app');
    const user = window.currentUser;

    const isAdmin = user && user.role === 'admin';

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
                    <p><strong>Роль:</strong> ${user?.role === 'admin' ? 'Администратор' : 'Пользователь'}</p>
                    <p><strong>Дата регистрации:</strong> ${user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</p>
                </div>
            </div>

            ${!isAdmin ? `
            <div class="profile-favorites">
                <h2>Избранные курсы</h2>
                <div id="favorites-list" class="favorites-grid"></div>
            </div>

            <div class="profile-applications">
                <h2>Мои заявки на курсы</h2>
                <div id="applications-list" class="applications-grid"></div>
            </div>
            ` : ''}
        </div>
    `;

    if (!isAdmin) {
        await loadFavorites();
        await loadApplications();
    }
}

async function loadFavorites() {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    try {
        const res = await fetch('/api/favorites');
        const favorites = await res.json();

        if (favorites.length === 0) {
            container.innerHTML = '<p>У вас пока нет избранных курсов. Перейдите на <a href="/courses">страницу курсов</a> чтобы добавить.</p>';
            return;
        }

        // Получаем данные о курсах
        const coursesRes = await fetch('/api/courses');
        const coursesData = await coursesRes.json();
        const allCourses = coursesData.courses || coursesData;

        const favoriteCourses = allCourses.filter(course =>
            favorites.some(f => f.course_id === course.id)
        );

        container.innerHTML = favoriteCourses.map(course => `
            <div class="favorite-card">
                <h3>${escapeHtml(course.title)}</h3>
                <p>${escapeHtml(course.description)}</p>
                <p>💰 Цена: ${course.price} BYN</p>
                <p>⏱ Длительность: ${course.duration}</p>
                <button class="remove-favorite-btn" data-id="${course.id}">🗑 Удалить из избранного</button>
            </div>
        `).join('');

        document.querySelectorAll('.remove-favorite-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const courseId = btn.dataset.id;
                const res = await fetch(`/api/favorites/${courseId}`, { method: 'DELETE' });
                const data = await res.json();
                if (data.success) {
                    showNotification('Удалено из избранного', 'success');
                    loadFavorites();
                } else {
                    showNotification(data.message, 'error');
                }
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки избранного', error);
    }
}

async function loadApplications() {
    const container = document.getElementById('applications-list');
    if (!container) return;

    try {
        const res = await fetch('/api/applications');
        const applications = await res.json();

        if (applications.length === 0) {
            container.innerHTML = '<p>У вас пока нет заявок. Перейдите на <a href="/courses">страницу курсов</a> чтобы записаться.</p>';
            return;
        }

        container.innerHTML = applications.map(app => `
            <div class="application-card">
                <p><strong>Курс ID:</strong> ${app.course_id}</p>
                <p><strong>Статус:</strong> <span class="status-${app.status}">${app.status === 'pending' ? 'На рассмотрении' : app.status === 'approved' ? 'Одобрена' : 'Отклонена'}</span></p>
                <p><strong>Дата подачи:</strong> ${new Date(app.created_at).toLocaleDateString()}</p>
                <button class="cancel-application-btn" data-id="${app.id}">Отменить заявку</button>
            </div>
        `).join('');

        document.querySelectorAll('.cancel-application-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const applicationId = btn.dataset.id;
                showConfirmModal(applicationId);
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки заявок', error);
    }
}

function showConfirmModal(applicationId) {
    const modal = document.createElement('div');
    modal.className = 'modal confirm-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="modal-close">&times;</span>
            <h3>Подтверждение отмены</h3>
            <p>Вы действительно хотите отменить заявку?</p>
            <div class="modal-buttons">
                <button class="modal-cancel-btn">Нет, закрыть</button>
                <button class="modal-confirm-btn" data-id="${applicationId}">Да, отменить</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('.modal-cancel-btn').onclick = () => modal.remove();

    modal.querySelector('.modal-confirm-btn').onclick = async () => {
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