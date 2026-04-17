import { showNotification } from '../modules/ui.js';

export async function renderAdmin() {
    const user = window.currentUser;

    if (!user || user.role !== 'admin') {
        document.getElementById('app').innerHTML = '<div class="form-container"><h2>Доступ запрещен</h2><p>У вас нет прав администратора</p><a href="/">На главную</a></div>';
        return;
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="admin-container">
            <h2>Админ-панель</h2>

            <div class="admin-tabs">
                <button class="tab-btn active" data-tab="courses">Управление курсами</button>
                <button class="tab-btn" data-tab="applications">Заявки</button>
                <button class="tab-btn" data-tab="users">Пользователи</button>
            </div>

            <div id="tab-courses" class="tab-content active">
                <h3>Добавить курс</h3>
                <div class="add-course-form">
                    <input type="text" id="title" placeholder="Название курса">
                    <textarea id="description" placeholder="Описание" rows="3"></textarea>
                    <input type="number" id="price" placeholder="Цена (BYN)" step="any">
                    <input type="text" id="duration" placeholder="Длительность">
                    <input type="text" id="category" placeholder="Категория">
                    <button id="addCourseBtn" class="btn-add-course">+ Добавить курс</button>
                </div>

                <div class="courses-separator"></div>

                <h3>Список курсов</h3>
                <div id="courses-list-admin"></div>
            </div>

            <div id="tab-applications" class="tab-content">
                <h3>Все заявки</h3>
                <div id="applications-list-admin"></div>
            </div>

            <div id="tab-users" class="tab-content">
                <h3>Пользователи</h3>
                <div id="users-list-admin"></div>
            </div>
        </div>
    `;

    await loadCoursesAdmin();
    await loadApplicationsAdmin();
    await loadUsersAdmin();

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        };
    });

    document.getElementById('addCourseBtn').onclick = addCourse;
}

async function loadCoursesAdmin() {
    const res = await fetch('/api/courses');
    const data = await res.json();
    const courses = data.courses || data;

    const container = document.getElementById('courses-list-admin');
    if (!container) return;

    if (!courses || courses.length === 0) {
        container.innerHTML = '<p>Нет курсов</p>';
        return;
    }

    container.innerHTML = courses.map(course => `
        <div class="admin-course-card" data-id="${course.id}">
            <h4>${escapeHtml(course.title)}</h4>
            <p>${escapeHtml(course.description)}</p>
            <p class="course-meta">💰 ${course.price} BYN | ⏱ ${course.duration} | 📚 ${course.category}</p>
            <div class="course-actions">
                <button class="edit-course-btn" data-id="${course.id}">✏ Редактировать</button>
                <button class="delete-course-btn" data-id="${course.id}" data-title="${escapeHtml(course.title)}">🗑 Удалить</button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-course-btn').forEach(btn => {
        btn.onclick = () => showEditModal(btn.dataset.id);
    });

    document.querySelectorAll('.delete-course-btn').forEach(btn => {
        btn.onclick = () => showDeleteModal(btn.dataset.id, btn.dataset.title);
    });
}

function showDeleteModal(courseId, courseTitle) {
    const modal = document.createElement('div');
    modal.className = 'modal delete-modal';
    modal.innerHTML = `
        <div class="modal-content delete-modal-content">
            <span class="modal-close">&times;</span>
            <div class="delete-icon">🗑</div>
            <h3>Подтверждение удаления</h3>
            <p>Вы действительно хотите удалить курс <strong>"${courseTitle}"</strong>?</p>
            <p class="delete-warning">Это действие нельзя отменить.</p>
            <div class="modal-buttons">
                <button class="modal-cancel-btn">Отмена</button>
                <button class="modal-confirm-btn" data-id="${courseId}">Да, удалить</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('.modal-cancel-btn').onclick = () => modal.remove();

    modal.querySelector('.modal-confirm-btn').onclick = async () => {
        const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE' });
        const data = await res.json();
        showNotification(data.message, data.success ? 'success' : 'error');
        if (data.success) {
            modal.remove();
            loadCoursesAdmin();
        }
    };
}

async function showEditModal(courseId) {
    const res = await fetch(`/api/courses/${courseId}`);
    const course = await res.json();

    const modal = document.createElement('div');
    modal.className = 'modal edit-modal';
    modal.innerHTML = `
        <div class="modal-content edit-modal-content">
            <span class="modal-close">&times;</span>
            <h3>✏ Редактирование курса</h3>
            <div class="edit-form">
                <label>Название курса</label>
                <input type="text" id="edit_title" value="${escapeHtml(course.title)}">

                <label>Описание</label>
                <textarea id="edit_description" rows="4">${escapeHtml(course.description || '')}</textarea>

                <label>Цена (BYN)</label>
                <input type="number" id="edit_price" value="${course.price}" step="any">

                <label>Длительность</label>
                <input type="text" id="edit_duration" value="${escapeHtml(course.duration || '')}">

                <label>Категория</label>
                <input type="text" id="edit_category" value="${escapeHtml(course.category || '')}">

                <div class="edit-buttons">
                    <button class="edit-cancel-btn">Отмена</button>
                    <button class="edit-save-btn" data-id="${courseId}">💾 Сохранить</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    modal.querySelector('.modal-close').onclick = () => modal.remove();
    modal.querySelector('.edit-cancel-btn').onclick = () => modal.remove();

    modal.querySelector('.edit-save-btn').onclick = async () => {
        const updatedData = {
            title: document.getElementById('edit_title').value.trim(),
            description: document.getElementById('edit_description').value.trim(),
            price: parseInt(document.getElementById('edit_price').value) || 0,
            duration: document.getElementById('edit_duration').value.trim(),
            category: document.getElementById('edit_category').value.trim()
        };

        if (!updatedData.title) {
            showNotification('Название курса обязательно', 'error');
            return;
        }

        const res = await fetch(`/api/courses/${courseId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });
        const data = await res.json();
        showNotification(data.message, data.success ? 'success' : 'error');
        if (data.success) {
            modal.remove();
            loadCoursesAdmin();
        }
    };
}

async function loadApplicationsAdmin() {
    const res = await fetch('/api/admin/applications');
    const apps = await res.json();
    const container = document.getElementById('applications-list-admin');
    if (!container) return;

    if (apps.length === 0) {
        container.innerHTML = '<p>Нет заявок</p>';
        return;
    }

    container.innerHTML = apps.map(app => `
        <div class="admin-application-card">
            <p><strong>Пользователь:</strong> ${escapeHtml(app.user_name)} (${app.user_email})</p>
            <p><strong>Курс:</strong> ${escapeHtml(app.course_title)}</p>
            <p><strong>Статус:</strong>
                <select class="status-select" data-id="${app.id}">
                    <option value="pending" ${app.status === 'pending' ? 'selected' : ''}>⏳ Ожидает</option>
                    <option value="approved" ${app.status === 'approved' ? 'selected' : ''}>✅ Одобрена</option>
                    <option value="rejected" ${app.status === 'rejected' ? 'selected' : ''}>❌ Отклонена</option>
                </select>
            </p>
            <p><strong>Дата:</strong> ${new Date(app.created_at).toLocaleDateString()}</p>
        </div>
    `).join('');

    document.querySelectorAll('.status-select').forEach(select => {
        select.onchange = async () => {
            const res = await fetch(`/api/admin/applications/${select.dataset.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: select.value })
            });
            const data = await res.json();
            showNotification(data.message, data.success ? 'success' : 'error');
        };
    });
}

async function loadUsersAdmin() {
    const res = await fetch('/api/admin/users');
    const users = await res.json();
    const container = document.getElementById('users-list-admin');
    if (!container) return;

    container.innerHTML = users.map(user => `
        <div class="admin-user-card">
            <p><strong>${escapeHtml(user.name)}</strong> (${user.email})</p>
            <p>Роль: ${user.role === 'admin' ? '👑 Администратор' : '👤 Пользователь'}</p>
            <p>Дата регистрации: ${new Date(user.created_at).toLocaleDateString()}</p>
        </div>
    `).join('');
}

async function addCourse() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    const price = document.getElementById('price').value;
    const duration = document.getElementById('duration').value.trim();
    const category = document.getElementById('category').value.trim();

    if (!title) {
        showNotification('Введите название курса', 'error');
        return;
    }

    const courseData = {
        title: title,
        description: description || '',
        price: price ? parseInt(price) : 0,
        duration: duration || '',
        category: category || ''
    };

    try {
        const res = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(courseData)
        });

        const data = await res.json();
        showNotification(data.message, data.success ? 'success' : 'error');

        if (data.success) {
            document.getElementById('title').value = '';
            document.getElementById('description').value = '';
            document.getElementById('price').value = '';
            document.getElementById('duration').value = '';
            document.getElementById('category').value = '';
            loadCoursesAdmin();
        }
    } catch (error) {
        showNotification('Ошибка соединения с сервером', 'error');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}