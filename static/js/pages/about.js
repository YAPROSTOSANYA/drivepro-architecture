export function renderAbout() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="about-container">
            <h1>О нашей автошколе</h1>
            <p>Мы работаем с 2010 года и обучили более 5000 водителей.</p>
            <p>Наши инструкторы имеют стаж вождения от 10 лет.</p>
            <p>Современный автопарк, удобное расположение, гибкий график занятий.</p>
        </div>
    `;
}