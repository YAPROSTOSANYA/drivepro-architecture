Схема данных:

Модель User
1) id
2) email
3) name
4) password_hash
5) role
6) created_at

Модель Course
1) id
2) title
3) description
4) price
5) duration
6) category
7) time
8) location
9) seats

Модель Application
1) id
2) user_id
3) course_id
4) status
5) created_at

Модель Favorite
1) id
2) user_id
3) course_id


API эндпоинты:

1) POST /api/auth/register — регистрация
2) POST /api/auth/login — вход
3) GET /api/auth/me — получение текущего пользователя
4) POST /api/auth/logout — выход
5) POST /api/auth/forgot-password — восстановление пароля (отправка нового на почту)
6) GET /api/courses — список курсов (с пагинацией, фильтрацией, поиском, сортировкой)
7) GET /api/courses/all — все курсы (без пагинации)
8) GET /api/courses/:id — детали курса
9) POST /api/courses — создание курса (админ)
10) PUT /api/courses/:id — обновление курса (админ)
11) DELETE /api/courses/:id — удаление курса (админ)
12) GET /api/favorites — избранное пользователя
13) POST /api/favorites/:id — добавить в избранное
14) DELETE /api/favorites/:id — удалить из избранного
15) GET /api/applications — заявки текущего пользователя
16) POST /api/applications — создание заявки
17) DELETE /api/applications/:id — отмена заявки
18) GET /api/admin/applications — все заявки (админ)
19) PUT /api/admin/applications/:id — обновить статус заявки (админ)
20) GET /api/admin/users — список пользователей (админ)