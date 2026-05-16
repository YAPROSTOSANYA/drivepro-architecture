let pollingInterval = null;

export function startPolling() {
    if (pollingInterval) return;

    pollingInterval = setInterval(async () => {
        const user = window.currentUser;
        if (!user) return;

        const path = window.location.pathname;

        // Для админа — обновляем заявки без перезагрузки
        if (path === '/admin' && user.role === 'admin') {
            if (typeof window.loadApplicationsAdmin === 'function') {
                await window.loadApplicationsAdmin();
                console.log('Заявки админа обновлены');
            }
            if (typeof window.loadCoursesAdmin === 'function') {
                await window.loadCoursesAdmin();
                console.log('Курсы админа обновлены');
            }
        }

        // Для пользователя в профиле — обновляем статус заявок
        if (path === '/profile') {
            if (typeof window.refreshApplications === 'function') {
                await window.refreshApplications();
                console.log('Статус заявок обновлён');
            }
        }

        // Для пользователя на странице курсов
        if (path === '/courses') {
            if (typeof window.loadCourses === 'function') {
                await window.loadCourses();
                console.log('Курсы обновлены');
            }
        }
    }, 5000);
}

export function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}