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
                <h2>⭐ Избранные курсы</h2>
                <div id="favorites-list" class="favorites-grid"></div>
            </div>

            <div class="profile-applications">
                <h2>📋 Мои заявки на курсы</h2>
                <div id="applications-list" class="favorites-grid"></div>
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
                <div class="favorite-buttons">
                    <button class="apply-from-favorite-btn" data-id="${course.id}">📝 Записаться</button>
                    <button class="remove-favorite-btn" data-id="${course.id}">🗑 Удалить из избранного</button>
                </div>
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

        document.querySelectorAll('.apply-from-favorite-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const courseId = btn.dataset.id;
                window.location.href = `/apply?course_id=${courseId}`;
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

        const coursesRes = await fetch('/api/courses');
        const coursesData = await coursesRes.json();
        const allCourses = coursesData.courses || coursesData;

        container.innerHTML = applications.map(app => {
            const course = allCourses.find(c => c.id === app.course_id);
            const courseTitle = course ? course.title : `Курс ID: ${app.course_id}`;
            const coursePrice = course ? course.price : '';
            const courseDuration = course ? course.duration : '';
            const courseDescription = course ? course.description : '';

            let statusText = '';
            let statusClass = '';
            let statusIcon = '';

            switch (app.status) {
                case 'pending':
                    statusText = 'На рассмотрении';
                    statusClass = 'status-pending';
                    statusIcon = '⏳';
                    break;
                case 'approved':
                    statusText = 'Одобрена';
                    statusClass = 'status-approved';
                    statusIcon = '✅';
                    break;
                case 'rejected':
                    statusText = 'Отклонена';
                    statusClass = 'status-rejected';
                    statusIcon = '❌';
                    break;
                default:
                    statusText = app.status;
                    statusClass = '';
                    statusIcon = '';
            }

            return `
                <div class="application-card">
                    <h3>${escapeHtml(courseTitle)}</h3>
                    <p>${escapeHtml(courseDescription)}</p>
                    <p>💰 Цена: ${coursePrice} BYN</p>
                    <p>⏱ Длительность: ${courseDuration}</p>
                    <div class="application-meta">
                        <span class="application-status ${statusClass}">${statusIcon} ${statusText}</span>
                        <span class="application-date">📅 ${new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                    <button class="cancel-application-btn" data-id="${app.id}">Отменить заявку</button>
                </div>
            `;
        }).join('');

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
            <div class="delete-icon">📋</div>
            <h3>Подтверждение отмены</h3>
            <p>Вы действительно хотите отменить эту заявку?</p>
            <p class="delete-warning">Это действие нельзя отменить.</p>
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