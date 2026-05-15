from flask import Flask, request, jsonify, render_template, session, redirect
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
db = SQLAlchemy(app)


# ================= МОДЕЛИ =================
class User(db.Model):
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
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Favorite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'))


# Создание таблиц и админа
with app.app_context():
    db.create_all()
    admin = User.query.filter_by(email='admin@example.com').first()
    if not admin:
        admin = User(email='admin@example.com', name='Администратор', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print("Админ создан: admin@example.com / admin123")


# ================= СТРАНИЦЫ =================
@app.route('/')
@app.route('/auth/login')
def login_page():
    return render_template('main.html', page='login')


@app.route('/auth/register')
def register_page():
    return render_template('main.html', page='register')


@app.route('/profile')
def profile_page():
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


# ================= API АУТЕНТИФИКАЦИИ =================
@app.route('/api/auth/register', methods=['POST'])
def register():
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
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'success': False, 'message': 'Неверный email или пароль'}), 401
    session['user_id'] = user.id
    session['user_name'] = user.name
    session['user_role'] = user.role
    return jsonify({'success': True, 'message': 'Вход выполнен',
                    'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}})


@app.route('/api/auth/me', methods=['GET'])
def get_me():
    if 'user_id' not in session:
        return jsonify({'success': False}), 401
    user = User.query.get(session['user_id'])
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
    session.clear()
    return jsonify({'success': True})


# ================= API КУРСОВ =================
@app.route('/api/courses', methods=['GET'])
def get_courses():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 6, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    price_range = request.args.get('price_range', '')
    sort = request.args.get('sort', 'title_asc')

    query = Course.query

    if search:
        query = query.filter(Course.title.ilike(f'%{search}%'))

    if category:
        query = query.filter(Course.category == category)

    if price_range and '-' in price_range:
        min_price, max_price = price_range.split('-')
        query = query.filter(Course.price >= int(min_price), Course.price <= int(max_price))

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
    course = Course.query.get(course_id)
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
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = User.query.get(session['user_id'])
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
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = User.query.get(session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    course = Course.query.get(course_id)
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
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = User.query.get(session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Курс не найден'}), 404

    db.session.delete(course)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Курс удалён'})


# ================= API ИЗБРАННОГО =================
@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    if 'user_id' not in session:
        return jsonify([])
    favs = Favorite.query.filter_by(user_id=session['user_id']).all()
    return jsonify([f.course_id for f in favs])


@app.route('/api/favorites/<int:course_id>', methods=['POST'])
def add_favorite(course_id):
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
    apps = Application.query.filter_by(user_id=session['user_id']).all()
    return jsonify(
        [{'id': a.id, 'course_id': a.course_id, 'status': a.status, 'created_at': a.created_at.isoformat()} for a in
         apps])


@app.route('/api/applications', methods=['POST'])
def create_application():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    data = request.get_json()
    course_id = data.get('course_id')

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'success': False, 'message': 'Курс не найден'}), 404

    if course.seats <= 0:
        return jsonify({'success': False, 'message': 'Нет свободных мест на этот курс'}), 400

    existing = Application.query.filter_by(user_id=session['user_id'], course_id=course_id).first()
    if existing:
        return jsonify({'success': False, 'message': 'Вы уже записаны на этот курс'}), 400

    app_entry = Application(user_id=session['user_id'], course_id=course_id)
    db.session.add(app_entry)

    course.seats -= 1

    db.session.commit()
    return jsonify({'success': True, 'message': 'Заявка подана'})


@app.route('/api/applications/<int:id>', methods=['DELETE'])
def delete_application(id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    app_entry = Application.query.filter_by(id=id, user_id=session['user_id']).first()
    if not app_entry:
        return jsonify({'success': False, 'message': 'Заявка не найдена'}), 404

    course = Course.query.get(app_entry.course_id)
    if course:
        course.seats += 1

    db.session.delete(app_entry)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Заявка отменена'})


# ================= API АДМИНА =================
@app.route('/api/admin/applications', methods=['GET'])
def admin_get_applications():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = User.query.get(session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    apps = Application.query.all()
    result = []
    for app in apps:
        user_app = User.query.get(app.user_id)
        course_app = Course.query.get(app.course_id)
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
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = User.query.get(session['user_id'])
    if not user.is_admin():
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    app_entry = Application.query.get(id)
    if not app_entry:
        return jsonify({'success': False, 'message': 'Заявка не найдена'}), 404

    data = request.get_json()
    if 'status' in data:
        app_entry.status = data['status']

    db.session.commit()
    return jsonify({'success': True, 'message': 'Статус обновлён'})


@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401
    user = User.query.get(session['user_id'])
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


# ================= ТЕСТОВЫЕ ДАННЫЕ =================
@app.route('/seed')
def seed():
    if Course.query.count() == 0:
        courses = [
            Course(title='Категория B (утро)', description='Обучение на легковой автомобиль. Теория и практика.',
                   price=1200, duration='2.5 месяца', category='Базовый', time='09:00, 11:00',
                   location='ул. Ленина, 10', seats=15),
            Course(title='Категория B (день)', description='Обучение на легковой автомобиль. Теория и практика.',
                   price=1200, duration='2.5 месяца', category='Базовый', time='14:00, 16:00',
                   location='ул. Ленина, 10', seats=12),
            Course(title='Категория B (вечер)', description='Обучение на легковой автомобиль. Теория и практика.',
                   price=1200, duration='2.5 месяца', category='Базовый', time='18:00, 20:00',
                   location='ул. Ленина, 10', seats=10),
            Course(title='Категория B (выходной)', description='Обучение на легковой автомобиль. Теория и практика.',
                   price=1300, duration='3 месяца', category='Базовый', time='10:00, 12:00 (сб, вс)',
                   location='ул. Ленина, 10', seats=8),
            Course(title='Категория A (утро)', description='Обучение на мотоцикл. Для начинающих и опытных.', price=800,
                   duration='1.5 месяца', category='Мото', time='09:00, 11:00', location='ул. Кирова, 5', seats=8),
            Course(title='Категория A (вечер)', description='Обучение на мотоцикл. Для начинающих и опытных.',
                   price=800, duration='1.5 месяца', category='Мото', time='17:00, 19:00', location='ул. Кирова, 5',
                   seats=6),
            Course(title='Категория A (выходной)', description='Обучение на мотоцикл. Для начинающих и опытных.',
                   price=900, duration='2 месяца', category='Мото', time='11:00, 13:00 (сб, вс)',
                   location='ул. Кирова, 5', seats=5),
            Course(title='Категория C (утро)',
                   description='Обучение на грузовой автомобиль. Профессиональная подготовка.', price=1500,
                   duration='3 месяца', category='Грузовой', time='08:00, 10:00', location='ул. Промышленная, 3',
                   seats=10),
            Course(title='Категория C (день)',
                   description='Обучение на грузовой автомобиль. Профессиональная подготовка.', price=1500,
                   duration='3 месяца', category='Грузовой', time='13:00, 15:00', location='ул. Промышленная, 3',
                   seats=8),
            Course(title='Категория C (вечер)',
                   description='Обучение на грузовой автомобиль. Профессиональная подготовка.', price=1500,
                   duration='3 месяца', category='Грузовой', time='18:00, 20:00', location='ул. Промышленная, 3',
                   seats=7),
            Course(title='Категория D (утро)', description='Обучение на автобус. Для работы в пассажирских перевозках.',
                   price=1800, duration='3.5 месяца', category='Автобус', time='09:00, 11:00',
                   location='пр. Независимости, 25', seats=12),
            Course(title='Категория D (день)', description='Обучение на автобус. Для работы в пассажирских перевозках.',
                   price=1800, duration='3.5 месяца', category='Автобус', time='14:00, 16:00',
                   location='пр. Независимости, 25', seats=10),
            Course(title='Категория D (вечер)',
                   description='Обучение на автобус. Для работы в пассажирских перевозках.', price=1800,
                   duration='3.5 месяца', category='Автобус', time='18:00, 20:00', location='пр. Независимости, 25',
                   seats=8)
        ]
        db.session.add_all(courses)
        db.session.commit()
        return 'Курсы добавлены (13 шт.)'
    return 'Курсы уже есть'


if __name__ == '__main__':
    app.run(debug=True)