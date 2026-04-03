export async function renderProfile() {
    const app = document.getElementById('app');
    const user = window.currentUser;

    app.innerHTML = `
        <div class="profile-container">
            <h2>Личный кабинет</h2>
            <p><strong>Имя:</strong> ${escapeHtml(user?.name || '')}</p>
            <p><strong>Email:</strong> ${escapeHtml(user?.email || '')}</p>
            <p><strong>Дата регистрации:</strong> ${user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''}</p>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}