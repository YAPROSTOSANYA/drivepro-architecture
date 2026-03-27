Схема данных:
Модель User
1) id
2) username
3) email
4) password_hash
5) role

Модель Course
1) id
2) title
3) description
4) price
5) duration

Модель Application
1) id
2) user_id
3) course_id
4) status
5) created_at



API эндпоинты:
1) POST /api/auth/register — регистрация
2) POST /api/auth/login — вход
3) GET /api/courses — список курсов
4) GET /api/courses/:id — детали курса
5) POST /api/applications — подача заявки
6) GET /api/profile — данные пользователя
7) POST /api/auth/forgot-password — запрос на восстановление пароля
8) POST /api/auth/reset-password — установка нового пароля
