export function renderHome() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="home-container">
            <h1>Добро пожаловать в DrivePro</h1>
            <p>Автошкола с лучшими инструкторами и современными программами обучения.</p>
            <a href="/courses" class="btn">Посмотреть курсы</a>
        </div>
    `;
}