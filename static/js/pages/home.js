export function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="home-container" style="text-align: center;">
            <div class="hero">
                <h1>Добро пожаловать в DrivePro</h1>
                <p>Официальная автошкола с лицензией и опытными инструкторами</p>
                <div class="hero-buttons">
                    <a href="/courses" class="btn btn-large">Посмотреть курсы</a>
                    <a href="/about" class="btn btn-outline">Узнать о нас</a>
                </div>
            </div>

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