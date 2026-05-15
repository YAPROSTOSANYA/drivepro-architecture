import { io } from 'https://cdn.socket.io/4.5.4/socket.io.esm.min.js';

let socket = null;

export function initSocket() {
    if (socket) return socket;

    socket = io();

    socket.on('connect', () => {
        console.log('WebSocket подключён');
    });

    socket.on('favorites_updated', (data) => {
        console.log('Избранное обновлено:', data);
        // Обновляем страницу, если мы на курсах
        if (window.location.pathname === '/courses') {
            if (typeof loadCourses === 'function') {
                loadCourses();
            }
        }
    });

    socket.on('applications_updated', (data) => {
        console.log('Заявки обновлены:', data);
        // Обновляем страницу профиля, если мы на ней
        if (window.location.pathname === '/profile') {
            if (typeof renderProfile === 'function') {
                renderProfile();
            }
        }
    });

    socket.on('application_status_changed', (data) => {
        console.log('Статус заявки изменён:', data);
        showNotification(`Статус заявки изменён на ${data.new_status}`, 'info');
        if (window.location.pathname === '/profile') {
            if (typeof renderProfile === 'function') {
                renderProfile();
            }
        }
    });

    socket.on('course_added', (data) => {
        console.log('Добавлен новый курс:', data);
        showNotification(`Новый курс: ${data.course_title}`, 'success');
        if (window.location.pathname === '/courses') {
            if (typeof loadCourses === 'function') {
                loadCourses();
            }
        }
    });

    socket.on('new_application', (data) => {
        console.log('Новая заявка:', data);
        if (window.currentUser?.role === 'admin') {
            showNotification(`Новая заявка от ${data.user_name} на курс ${data.course_title}`, 'info');
            if (window.location.pathname === '/admin') {
                if (typeof loadApplicationsAdmin === 'function') {
                    loadApplicationsAdmin();
                }
            }
        }
    });

    return socket;
}

function showNotification(message, type) {
    // Используем существующую функцию из ui.js
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}