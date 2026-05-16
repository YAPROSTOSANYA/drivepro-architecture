let pollingInterval = null;

export function startPolling() {
    if (pollingInterval) return;

    pollingInterval = setInterval(async () => {
        const user = window.currentUser;
        if (!user || user.role === 'admin') return;

        const path = window.location.pathname;

        if (path === '/profile') {
            // Обновляем заявки и избранное в профиле
            if (typeof window.loadApplications === 'function') {
                await window.loadApplications();
            }
            if (typeof window.loadFavorites === 'function') {
                await window.loadFavorites();
            }
        } else if (path === '/courses') {
            // Обновляем курсы
            if (typeof window.loadCourses === 'function') {
                await window.loadCourses();
            }
        }
    }, 5000); // каждые 5 секунд
}

export function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}