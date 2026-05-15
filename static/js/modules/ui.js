export function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="loader">
                <div class="spinner"></div>
                <div>Загрузка...</div>
            </div>
        `;
    }
}

export function hideLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const loader = container.querySelector('.loader');
        if (loader) loader.remove();
    }
}

export function showError(message) {
    showNotification(message, 'error');
}

export function showSuccess(message) {
    showNotification(message, 'success');
}

export function showNotification(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.innerHTML = `<span>${escapeHtml(message)}</span><button class="toast-close">&times;</button>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    notification.querySelector('.toast-close').onclick = () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    };
    setTimeout(() => {
        if (notification.parentElement) notification.remove();
    }, 4000);
}

export function renderNav(user) {
    const nav = document.getElementById('nav');
    const mobileNav = document.getElementById('mobileNav');
    let navContent = '';
    if (user) {
        let adminLink = '';
        let applyLink = '';
        if (user.role === 'admin') {
            adminLink = '<a href="/admin">Админ</a>';
        } else {
            applyLink = '<a href="/apply">Записаться</a>';
        }
        navContent = `
            <a href="/">Главная</a>
            <a href="/about">О школе</a>
            <a href="/courses">Курсы</a>
            <a href="/profile">Профиль</a>
            ${applyLink}
            ${adminLink}
            <span>Привет, ${user.name}</span>
            <button onclick="window.logout()">Выйти</button>
        `;
    } else {
        navContent = `
            <a href="/">Главная</a>
            <a href="/about">О школе</a>
            <a href="/courses">Курсы</a>
            <a href="/auth/login">Войти</a>
            <a href="/auth/register">Регистрация</a>
        `;
    }
    if (nav) nav.innerHTML = navContent;
    if (mobileNav) mobileNav.innerHTML = navContent;

    // Привязываем выход для мобильного меню
    const logoutBtn = mobileNav ? mobileNav.querySelector('button') : null;
    if (logoutBtn && logoutBtn.textContent === 'Выйти') {
        logoutBtn.onclick = () => window.logout();
    }
}

export function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const mobileNav = document.getElementById('mobileNav');
    if (!menuBtn || !mobileNav) return;

    // Удаляем старые обработчики
    const newBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newBtn, menuBtn);
    const newMenuBtn = document.getElementById('mobileMenuBtn');

    newMenuBtn.addEventListener('click', () => {
        newMenuBtn.classList.toggle('active');
        mobileNav.classList.toggle('open');
    });

    mobileNav.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) {
            newMenuBtn.classList.remove('active');
            mobileNav.classList.remove('open');
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function renderFooter() {
    const footer = document.getElementById('footer');
    if (!footer) return;

    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-section">
                <h4>Drive-Pro</h4>
                <p>Автошкола с лучшими инструкторами</p>
            </div>
            <div class="footer-section">
                <h4>Контакты</h4>
                <p>📞 +375 (29) 123-45-67</p>
                <p>📧 info@drivepro.by</p>
            </div>
            <div class="footer-section">
                <h4>Режим работы</h4>
                <p>Пн-Пт: 9:00 - 20:00</p>
                <p>Сб: 10:00 - 16:00</p>
            </div>
            <div class="footer-bottom">
                <p>&copy; 2026 Drive-Pro. Все права защищены.</p>
            </div>
        </div>
    `;
}