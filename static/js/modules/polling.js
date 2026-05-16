let pollingInterval = null;

export function startPolling() {
    // Предотвращаем создание нескольких интервалов
    if (pollingInterval) return;

    pollingInterval = setInterval(async () => {
        const user = window.currentUser;
        if (!user) return;

        const path = window.location.pathname;

        // Автообновление админ-панели только для администратора
        if (path === '/admin' && user.role === 'admin') {
            // Проверяем наличие глобальных функций из admin.js
            if (typeof window.loadApplicationsAdmin === 'function') {
                await window.loadApplicationsAdmin();
            }
            if (typeof window.loadCoursesAdmin === 'function') {
                await window.loadCoursesAdmin();
            }
        }

        // Автообновление списка заявок в личном кабинете
        if (path === '/profile') {
            if (typeof window.refreshApplications === 'function') {
                await window.refreshApplications();
            }
        }

        // Автообновление списка курсов
        if (path === '/courses') {
            if (typeof window.loadCourses === 'function') {
                await window.loadCourses();
            }
        }
    }, 5000); // Каждые 5 секунд
}

export function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}