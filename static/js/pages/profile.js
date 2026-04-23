import { showNotification, renderNav } from '../modules/ui.js';

export async function renderProfile() {
    const app = document.getElementById('app');
    const user = window.currentUser;

    // Принудительно обновляем навигацию
    renderNav(user);

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
            <div class="profile-actions">
                <button id="changePasswordBtn" class="btn-action">🔐 Сменить пароль</button>
            </div>

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

        const changeBtn = document.getElementById('changePasswordBtn');
        if (changeBtn) {
            changeBtn.onclick = () => showChangePasswordModal();
        }
    }
}

function showChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal change-password-modal';
    modal.innerHTML = `
        <div class="modal-content change-password-modal-content">
            <span class="modal-close">&times;</span>
            <h3>🔐 Смена пароля</h3>
            <div class="change-password-form">
                <input type="password" id="modal_old_password" placeholder="Текущий пароль">
                <input type="password" id="modal_new_password" placeholder="Новый пароль">
                <input type="password" id="modal_confirm_password" placeholder="Подтвердите новый пароль">
                <div id="modal-password-strength" class="password-strength"></div>
                <div id="modal-password-hint" class="password-hint"></div>
                <div class="modal-buttons">
                    <button class="modal-cancel-btn">Отмена</button>
                    <button class="modal-save-btn">Сохранить</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    const newPasswordInput = document.getElementById('modal_new_password');
    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', () => {
            checkPasswordStrengthInModal();
        });
    }

    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('.modal-cancel-btn').onclick = () => modal.remove();

    modal.querySelector('.modal-save-btn').onclick = async () => {
        const oldPassword = document.getElementById('modal_old_password').value;
        const newPassword = document.getElementById('modal_new_password').value;
        const confirmPassword = document.getElementById('modal_confirm_password').value;

        if (!oldPassword || !newPassword || !confirmPassword) {
            showNotification('Заполните все поля', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('Новый пароль и подтверждение не совпадают', 'error');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            showNotification('Пароль должен содержать минимум 6 символов, заглавную и строчную буквы, цифру и спецсимвол (@$!%*?&)', 'error');
            return;
        }

        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
        });
        const data = await res.json();

        if (data.success) {
            showNotification('Пароль успешно изменён', 'success');
            modal.remove();
        } else {
            showNotification(data.message, 'error');
        }
    };
}

function checkPasswordStrengthInModal() {
    const password = document.getElementById('modal_new_password')?.value || '';
    const strengthDiv = document.getElementById('modal-password-strength');
    const hintDiv = document.getElementById('modal-password-hint');
    if (!strengthDiv) return;

    if (password.length === 0) {
        strengthDiv.textContent = '';
        if (hintDiv) hintDiv.innerHTML = '';
        return;
    }

    let strength = 0;
    let hints = [];

    if (password.length >= 6) {
        strength++;
    } else {
        hints.push('• минимум 6 символов');
    }

    if (password.match(/[A-Z]/)) {
        strength++;
    } else {
        hints.push('• хотя бы одну заглавную букву (A-Z)');
    }

    if (password.match(/[a-z]/)) {
        strength++;
    } else {
        hints.push('• хотя бы одну строчную букву (a-z)');
    }

    if (password.match(/[0-9]/)) {
        strength++;
    } else {
        hints.push('• хотя бы одну цифру');
    }

    if (password.match(/[@$!%*?&]/)) {
        strength++;
    } else {
        hints.push('• хотя бы один спецсимвол (@$!%*?&)');
    }

    const messages = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Сильный'];
    const colors = ['#e53e3e', '#ed8936', '#ecc94b', '#48bb78', '#38a169'];

    if (strength <= 2) {
        strengthDiv.textContent = messages[0];
        strengthDiv.style.color = colors[0];
    } else {
        const index = Math.min(strength - 2, messages.length - 1);
        strengthDiv.textContent = messages[index];
        strengthDiv.style.color = colors[index];
    }

    if (hintDiv && hints.length > 0 && strength < 5) {
        hintDiv.innerHTML = '<small>Пароль должен содержать:</small><br>' + hints.join('<br>');
        hintDiv.style.color = '#666';
        hintDiv.style.fontSize = '12px';
        hintDiv.style.marginTop = '-10px';
        hintDiv.style.marginBottom = '10px';
    } else if (hintDiv) {
        hintDiv.innerHTML = '';
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
            let statusMessage = '';

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
                    statusMessage = '<p class="status-message">📧 С вами свяжутся по электронной почте в ближайшее время.</p>';
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
                    ${statusMessage}
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