export async function renderHome() {
    // Загружаем курсы для отображения популярных
    let popularCourses = [];
    try {
        const res = await fetch('/api/courses/all');
        const allCourses = await res.json();
        // Берём первые 3 курса как популярные
        popularCourses = allCourses.slice(0, 3);
    } catch (error) {
        console.error('Ошибка загрузки курсов', error);
    }

    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="home-container">
            <!-- Hero секция -->
            <div class="hero">
                <h1>Добро пожаловать в DrivePro</h1>
                <p>Официальная автошкола с лицензией и опытными инструкторами</p>
                <div class="hero-buttons">
                    <a href="/courses" class="btn btn-large">Посмотреть курсы</a>
                    <a href="/about" class="btn btn-outline">Узнать о нас</a>
                </div>
            </div>

            <!-- Акции и спецпредложения -->
            <div class="promo-section">
                <h2>🔥 Акции и спецпредложения</h2>
                <div class="promo-grid">
                    <div class="promo-card">
                        <div class="promo-icon">🎓</div>
                        <h3>Скидка 10% на обучение</h3>
                        <p>При записи на полный курс до конца месяца. Акция действует для всех категорий.</p>
                        <span class="promo-date">До 31 мая 2026</span>
                        <a href="/courses" class="promo-btn">Записаться →</a>
                    </div>
                    <div class="promo-card">
                        <div class="promo-icon">👥</div>
                        <h3>Приведи друга — получи скидку</h3>
                        <p>Приведи друга на обучение и получи скидку 15% на следующий курс. Друг тоже получает скидку 5%.</p>
                        <span class="promo-date">Постоянная акция</span>
                        <a href="/about" class="promo-btn">Подробнее →</a>
                    </div>
                    <div class="promo-card">
                        <div class="promo-icon">🚗</div>
                        <h3>Бесплатное пробное занятие</h3>
                        <p>Первое занятие с инструктором — абсолютно бесплатно. Оцените качество обучения!</p>
                        <span class="promo-date">Для новых учеников</span>
                        <a href="/apply" class="promo-btn">Записаться →</a>
                    </div>
                </div>
            </div>

            <!-- Популярные курсы -->
            <div class="popular-section">
                <h2>⭐ Популярные курсы</h2>
                <div class="popular-grid" id="popular-courses-list">
                    ${popularCourses.length > 0 ? popularCourses.map(course => `
                        <div class="popular-card">
                            <div class="popular-category">${escapeHtml(course.category)}</div>
                            <h3>${escapeHtml(course.title)}</h3>
                            <p>${escapeHtml(course.description.substring(0, 100))}${course.description.length > 100 ? '...' : ''}</p>
                            <div class="popular-price">${course.price} BYN</div>
                            <div class="popular-duration">⏱ ${course.duration}</div>
                            <a href="/courses/${course.id}" class="btn popular-btn">Подробнее</a>
                        </div>
                    `).join('') : '<p>Загрузка курсов...</p>'}
                </div>
            </div>

            <!-- Преимущества -->
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🚗</div>
                    <h3>Современный автопарк</h3>
                    <p>Автомобили не старше 3 лет с автоматической и механической коробкой передач</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">👨‍🏫</div>
                    <h3>Опытные инструкторы</h3>
                    <p>Стаж вождения от 10 лет, индивидуальный подход к каждому ученику</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">📜</div>
                    <h3>Официальная лицензия</h3>
                    <p>Государственная лицензия на образовательную деятельность</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🎓</div>
                    <h3>Высокая успеваемость</h3>
                    <p>98% наших учеников успешно сдают экзамены с первого раза</p>
                </div>
            </div>

            <!-- Статистика -->
            <div class="stats">
                <div class="stat">
                    <span class="stat-number">5000+</span>
                    <span class="stat-label">Выпускников</span>
                </div>
                <div class="stat">
                    <span class="stat-number">15+</span>
                    <span class="stat-label">Лет на рынке</span>
                </div>
                <div class="stat">
                    <span class="stat-number">20+</span>
                    <span class="stat-label">Инструкторов</span>
                </div>
            </div>
        </div>
    `;
}

// Защита от XSS-атак при вставке данных из API
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}