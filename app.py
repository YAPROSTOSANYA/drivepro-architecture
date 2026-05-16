from flask import Flask, request, jsonify, render_template, session, redirect
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import secrets
import string

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Настройки почты для Gmail SMTP
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'driveprosupport@gmail.com'
app.config['MAIL_PASSWORD'] = 'kzomfbauezdvfirs'
app.config['MAIL_DEFAULT_SENDER'] = 'driveprosupport@gmail.com'

db = SQLAlchemy(app)
mail = Mail(app)


# ================= МОДЕЛИ БАЗЫ ДАННЫХ =================
class User(db.Model):
    """Модель пользователя. Хранит email, имя, хеш пароля, роль и дату регистрации."""
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='user')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def is_admin(self):
        return self.role == 'admin'


class Course(db.Model):
    """Модель курса. Содержит описание, цену, длительность, время, место и количество мест."""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    price = db.Column(db.Integer)
    duration = db.Column(db.String(50))
    category = db.Column(db.String(50))
    time = db.Column(db.String(100))
    location = db.Column(db.String(200))
    seats = db.Column(db.Integer, default=10)


class Application(db.Model):
    """Модель заявки на курс. Связывает пользователя и курс, хранит статус заявки."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Favorite(db.Model):
    """Модель избранного. Связывает пользователя и курс."""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))


# Создание таблиц и дефолтного администратора
with app.app_context():
    db.create_all()
    if not User.query.filter_by(email='admin@example.com').first():
        admin = User(email='admin@example.com', name='Администратор', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()


# ================= СТРАНИЦЫ ФРОНТЕНДА =================
@app.route('/')
@app.route('/auth/login')
def login_page():
    return render_template('main.html', page='login')


@app.route('/auth/register')
def register_page():
    return render_template('main.html', page='register')


@app.route('/profile')
def profile_page():
    # Проверка авторизации: если нет сессии, перенаправляем на страницу входа
    if 'user_id' not in session:
        return redirect('/auth/login')
    return render_template('main.html', page='profile')


@app.route('/courses')
def courses_page():
    return render_template('main.html', page='courses')


@app.route('/courses/<int:course_id>')
def course_detail_page(course_id):
    return render_template('main.html', page='course_detail')


@app.route('/apply')
def apply_page():
    return render_template('main.html', page='apply')


@app.route('/admin')
def admin_page():
    return render_template('main.html', page='admin')


# Обработчик ошибки 404
@app.errorhandler(404)
def not_found(error):
    return render_template('main.html', page='404'), 404


# ================= API АУТЕНТИФИКАЦИИ =================
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Регистрация нового пользователя. Проверяет уникальность email."""
    data = request.get_json()
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'success': False, 'message': 'Пользователь уже существует'}), 400
    user = User(email=data['email'], name=data['name'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Регистрация успешна'})


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Вход пользователя. При успешной проверке создаёт сессию."""
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'success': False, 'message': 'Неверный email или пароль'}), 401

    session['user_id'] = user.id
    session['user_name'] = user.name
    session['user_role'] = user.role

    # Опция "Запомнить меня": устанавливает сессию на 30 дней
    remember_me = data.get('remember_me', False)
    if remember_me:
        session.permanent = True
        app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)
    else:
        session.permanent = False

    return jsonify({'success': True, 'message': 'Вход выполнен',
                    'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}})


@app.route('/api/auth/me', methods=['GET'])
def get_me():
    """Возвращает информацию о текущем авторизованном пользователе."""
    if 'user_id' not in session:
        return jsonify({'success': False}), 401
    user = db.session.get(User, session['user_id'])
    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'role': user.role,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
    })


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Завершение сессии (выход из аккаунта)."""
    session.clear()
    return jsonify({'success': True})


# ================= ВОССТАНОВЛЕНИЕ ПАРОЛЯ =================
@app.route('/api/auth/forgot-password', methods=['POST'])
def forgot_password():
    """
    Восстановление пароля.
    Генерирует случайный 8-символьный пароль, сохраняет его в БД и отправляет на email.
    """
    data = request.get_json()
    email = data.get('email')

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': False, 'message': 'Пользователь с таким email не найден'}), 404

    # Генерация случайного пароля из букв и цифр
    new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(8))
    user.set_password(new_password)
    db.session.commit()

    try:
        msg = Message('Восстановление пароля DrivePro', recipients=[email])
        msg.body = f'''Здравствуйте, {user.name}!

Вы запросили восстановление пароля на сайте DrivePro.

Ваш новый пароль: {new_password}

Пожалуйста, войдите в систему с этим паролем и смените его в личном кабинете.

С уважением,
Команда DrivePro'''
        mail.send(msg)
        return jsonify({'success': True, 'message': 'Новый пароль отправлен на вашу почту'})
    except Exception as e:
        return jsonify({'success': False, 'message': 'Ошибка отправки письма'}), 500


# ================= API КУРСОВ =================
@app.route('/api/courses', methods=['GET'])
def get_courses():
    """
    Получение списка курсов с пагинацией, поиском, фильтрацией и сортировкой.
    Параметры: page, per_page, search, category, price_range, sort.
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 6, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    price_range = request.args.get('price_range', '')
    sort = request.args.get('sort', 'title_asc')

    query = Course.query

    # Поиск по названию
    if search:
        query = query.filter(Course.title.ilike(f'%{search}%'))

    # Фильтрация по категории
    if category:
        query = query.filter(Course.category == category)

    # Фильтрация по цене (диапазон)
    if price_range and '-' in price_range:
        min_price, max_price = price_range.split('-')
        query = query.filter(Course.price >= int(min_price), Course.price <= int(max_price))

    # Сортировка
    if sort == 'title_asc':
        query = query.order_by(Course.title.asc())
    elif sort == 'title_desc':
        query = query.order_by(Course.title.desc())
    elif sort == 'price_asc':
        query = query.order_by(Course.price.asc())
    elif sort == 'price_desc':
        query = query.order_by(Course.price.desc())

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    courses = pagination.items

    return jsonify({
        'courses': [{
            'id': c.id,
            'title': c.title,
            'description': c.description,
            'price': c.price,
            'duration': c.duration,
            'category': c.category,
            'time': c.time,
            'location': c.location,
            'seats': c.seats
        } for c in courses],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': pagination.per_page
    })


@app.route('/api/courses/all', methods=['GET'])
def get_all_courses():
    """Возвращает ВСЕ курсы без пагинации (используется для выпадающих списков и избранного)."""
    courses = Course.query.all()
    return jsonify([{
        'id': c.id,
        'title': c.title,
        'description': c.description,
        'price': c.price,
        'duration': c.duration,
        'category': c.category,
        'time': c.time,
        'location': c.location,
        'seats': c.seats
    } for c in courses])


@app.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    """Возвращает детальную информацию об одном курсе."""
    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Курс не найден'}), 404
    return jsonify({
        'id': course.id,
        'title': course.title,
        'description': course.description,
        'price': course.price,
        'duration': course.duration,
        'category': course.category,
        'time': course.time,
        'location': course.location,
        'seats': course.seats
    })


@app.route('/api/courses', methods=['POST'])
def create_course():
    """Создание нового курса. Доступно только администратору."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = db.session.get(User, session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    data = request.get_json()
    course = Course(
        title=data['title'],
        description=data.get('description', ''),
        price=data.get('price', 0),
        duration=data.get('duration', ''),
        category=data.get('category', ''),
        time=data.get('time', ''),
        location=data.get('location', ''),
        seats=data.get('seats', 10)
    )
    db.session.add(course)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Курс создан'})


@app.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    """Обновление курса. Доступно только администратору."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = db.session.get(User, session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Курс не найден'}), 404

    data = request.get_json()
    if 'title' in data:
        course.title = data['title']
    if 'description' in data:
        course.description = data['description']
    if 'price' in data:
        course.price = data['price']
    if 'duration' in data:
        course.duration = data['duration']
    if 'category' in data:
        course.category = data['category']
    if 'time' in data:
        course.time = data['time']
    if 'location' in data:
        course.location = data['location']
    if 'seats' in data:
        course.seats = data['seats']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Курс обновлён'})


@app.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    """Удаление курса. Доступно только администратору."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = db.session.get(User, session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Курс не найден'}), 404

    db.session.delete(course)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Курс удалён'})


# ================= API ИЗБРАННОГО =================
@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    """Возвращает список ID курсов, добавленных пользователем в избранное."""
    if 'user_id' not in session:
        return jsonify([])
    favs = Favorite.query.filter_by(user_id=session['user_id']).all()
    return jsonify([f.course_id for f in favs])


@app.route('/api/favorites/<int:course_id>', methods=['POST'])
def add_favorite(course_id):
    """Добавляет курс в избранное текущего пользователя."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    existing = Favorite.query.filter_by(user_id=session['user_id'], course_id=course_id).first()
    if existing:
        return jsonify({'success': False, 'message': 'Уже в избранном'}), 400
    fav = Favorite(user_id=session['user_id'], course_id=course_id)
    db.session.add(fav)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Добавлено в избранное'})


@app.route('/api/favorites/<int:course_id>', methods=['DELETE'])
def remove_favorite(course_id):
    """Удаляет курс из избранного текущего пользователя."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    fav = Favorite.query.filter_by(user_id=session['user_id'], course_id=course_id).first()
    if not fav:
        return jsonify({'success': False, 'message': 'Не найдено'}), 404
    db.session.delete(fav)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Удалено из избранного'})


# ================= API ЗАЯВОК =================
@app.route('/api/applications', methods=['GET'])
def get_applications():
    """Возвращает список заявок текущего пользователя."""
    apps = Application.query.filter_by(user_id=session['user_id']).all()
    return jsonify([{'id': a.id, 'course_id': a.course_id, 'status': a.status, 'created_at': a.created_at.isoformat()} for a in apps])


@app.route('/api/applications', methods=['POST'])
def create_application():
    """
    Создаёт новую заявку на курс.
    Проверяет наличие мест и что пользователь ещё не записан на этот курс.
    """
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    data = request.get_json()
    course_id = data.get('course_id')

    course = db.session.get(Course, course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Курс не найден'}), 404

    # Проверка наличия свободных мест
    if course.seats <= 0:
        return jsonify({'success': False, 'message': 'Нет свободных мест на этот курс'}), 400

    existing = Application.query.filter_by(user_id=session['user_id'], course_id=course_id).first()
    if existing:
        return jsonify({'success': False, 'message': 'Вы уже записаны на этот курс'}), 400

    app_entry = Application(user_id=session['user_id'], course_id=course_id)
    db.session.add(app_entry)

    # Уменьшаем количество свободных мест
    course.seats -= 1

    db.session.commit()
    return jsonify({'success': True, 'message': 'Заявка подана'})


@app.route('/api/applications/<int:id>', methods=['DELETE'])
def delete_application(id):
    """
    Отменяет заявку на курс.
    При отмене количество свободных мест увеличивается.
    """
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    app_entry = Application.query.filter_by(id=id, user_id=session['user_id']).first()
    if not app_entry:
        return jsonify({'success': False, 'message': 'Заявка не найдена'}), 404

    course = db.session.get(Course, app_entry.course_id)
    if course:
        course.seats += 1

    db.session.delete(app_entry)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Заявка отменена'})


# ================= API АДМИНА =================
@app.route('/api/admin/applications', methods=['GET'])
def admin_get_applications():
    """Админская версия: возвращает ВСЕ заявки с информацией о пользователе и курсе."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = db.session.get(User, session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    apps = Application.query.all()
    result = []
    for app in apps:
        user_app = db.session.get(User, app.user_id)
        course_app = db.session.get(Course, app.course_id)
        result.append({
            'id': app.id,
            'user_name': user_app.name if user_app else 'Unknown',
            'user_email': user_app.email if user_app else 'Unknown',
            'course_title': course_app.title if course_app else 'Unknown',
            'status': app.status,
            'created_at': app.created_at.isoformat()
        })
    return jsonify(result)


@app.route('/api/admin/applications/<int:id>', methods=['PUT'])
def admin_update_application(id):
    """Админская версия: изменяет статус заявки (одобрена/отклонена)."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = db.session.get(User, session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    app_entry = db.session.get(Application, id)
    if not app_entry:
        return jsonify({'success': False, 'message': 'Заявка не найдена'}), 404

    data = request.get_json()
    if 'status' in data:
        app_entry.status = data['status']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Статус обновлён'})


@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    """Админская версия: возвращает список всех пользователей."""
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = db.session.get(User, session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    users = User.query.all()
    result = []
    for u in users:
        result.append({
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'role': u.role,
            'created_at': u.created_at.isoformat() if u.created_at else None
        })
    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)