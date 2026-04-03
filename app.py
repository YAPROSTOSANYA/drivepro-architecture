from flask import Flask, request, jsonify, render_template, session, redirect
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from sqlalchemy import or_

app = Flask(__name__)

# Конфигурация
app.config['SECRET_KEY'] = 'your-secret-key-12345'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


# ================= МОДЕЛИ =================
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(200))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500))
    price = db.Column(db.Integer)
    duration = db.Column(db.String(50))
    category = db.Column(db.String(50))
    image = db.Column(db.String(200))


class Application(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# Создание таблиц
with app.app_context():
    db.create_all()
    print("База данных создана")


# ================= СТРАНИЦЫ ФРОНТЕНДА =================
@app.route('/')
def home_page():
    return render_template('main.html', page='home')


@app.route('/about')
def about_page():
    return render_template('main.html', page='about')


@app.route('/courses')
def courses_page():
    return render_template('main.html', page='courses')


@app.route('/courses/<int:course_id>')
def course_detail_page(course_id):
    return render_template('main.html', page='course_detail')


@app.route('/profile')
def profile_page():
    return render_template('main.html', page='profile')


@app.route('/applications')
def applications_page():
    return render_template('main.html', page='applications')


@app.route('/apply')
def apply_page():
    return render_template('main.html', page='apply')


@app.route('/admin')
def admin_page():
    return render_template('main.html', page='admin')


@app.route('/auth/login')
def auth_login_page():
    return render_template('main.html', page='login')


@app.route('/auth/register')
def auth_register_page():
    return render_template('main.html', page='register')


@app.route('/cabinet')
def cabinet_page():
    if 'user_id' not in session:
        return redirect('/auth/login')
    return render_template('main.html', page='cabinet')


# ================= API АУТЕНТИФИКАЦИИ =================
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'success': False, 'message': 'Все поля обязательны'}), 400

        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Пользователь уже существует'}), 400

        user = User(email=data['email'], name=data['name'])
        user.set_password(data['password'])

        db.session.add(user)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Регистрация успешна'}), 201

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()

        if not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'message': 'Email и пароль обязательны'}), 400

        user = User.query.filter_by(email=data['email']).first()

        if not user or not user.check_password(data['password']):
            return jsonify({'success': False, 'message': 'Неверный email или пароль'}), 401

        session['user_id'] = user.id
        session['user_name'] = user.name

        return jsonify({
            'success': True,
            'message': 'Вход выполнен',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/auth/me', methods=['GET'])
def get_me():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    user = User.query.get(session['user_id'])
    if not user:
        return jsonify({'success': False, 'message': 'Пользователь не найден'}), 404

    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'created_at': user.created_at.isoformat() if user.created_at else None
        }
    }), 200


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Выход выполнен'}), 200


# ================= API ДЛЯ ITEMS =================
@app.route('/api/items', methods=['GET'])
def get_items():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    items = Item.query.filter_by(user_id=session['user_id']).all()

    result = []
    for item in items:
        result.append({
            'id': item.id,
            'title': item.title,
            'description': item.description or ''
        })

    return jsonify({'success': True, 'items': result}), 200


@app.route('/api/items', methods=['POST'])
def create_item():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    try:
        data = request.get_json()

        if not data.get('title'):
            return jsonify({'success': False, 'message': 'Название обязательно'}), 400

        item = Item(
            title=data['title'],
            description=data.get('description', ''),
            user_id=session['user_id']
        )

        db.session.add(item)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Элемент создан',
            'item': {
                'id': item.id,
                'title': item.title,
                'description': item.description
            }
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/items/<int:item_id>', methods=['DELETE'])
def delete_item(item_id):
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    try:
        item = Item.query.filter_by(id=item_id, user_id=session['user_id']).first()

        if not item:
            return jsonify({'success': False, 'message': 'Элемент не найден'}), 404

        db.session.delete(item)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Элемент удален'}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ================= API КУРСОВ =================
@app.route('/api/courses', methods=['GET'])
def get_courses():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 6, type=int)
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    price_range = request.args.get('price_range', '')

    query = Course.query

    if search:
        query = query.filter(Course.title.ilike(f'%{search}%'))

    if category:
        query = query.filter(Course.category == category)

    if price_range:
        if '-' in price_range:
            min_price, max_price = price_range.split('-')
            query = query.filter(Course.price >= int(min_price), Course.price <= int(max_price))

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
            'image': c.image
        } for c in courses],
        'total': pagination.total,
        'page': pagination.page,
        'pages': pagination.pages,
        'per_page': pagination.per_page
    }), 200


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
        'image': course.image
    }), 200


@app.route('/api/courses', methods=['POST'])
def create_course():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    user = User.query.get(session['user_id'])
    if user.email != 'admin@example.com':
        return jsonify({'success': False, 'message': 'Доступ запрещен'}), 403

    try:
        data = request.get_json()
        course = Course(
            title=data['title'],
            description=data.get('description', ''),
            price=data.get('price', 0),
            duration=data.get('duration', ''),
            category=data.get('category', ''),
            image=data.get('image', '')
        )
        db.session.add(course)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Курс создан'}), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ================= API ЗАЯВОК =================
@app.route('/api/applications', methods=['GET'])
def get_applications():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    apps = Application.query.filter_by(user_id=session['user_id']).all()
    return jsonify([{
        'id': a.id,
        'course_id': a.course_id,
        'status': a.status,
        'created_at': a.created_at.isoformat()
    } for a in apps]), 200


@app.route('/api/applications', methods=['POST'])
def create_application():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    try:
        data = request.get_json()
        course_id = data.get('course_id')

        if not course_id:
            return jsonify({'success': False, 'message': 'ID курса обязателен'}), 400

        course = Course.query.get(course_id)
        if not course:
            return jsonify({'success': False, 'message': 'Курс не найден'}), 404

        existing = Application.query.filter_by(user_id=session['user_id'], course_id=course_id).first()
        if existing:
            return jsonify({'success': False, 'message': 'Вы уже записаны на этот курс'}), 400

        app_entry = Application(user_id=session['user_id'], course_id=course_id)
        db.session.add(app_entry)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Заявка подана'}), 201

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ================= ТЕСТОВЫЕ ДАННЫЕ =================
@app.route('/seed')
def seed():
    if Course.query.count() == 0:
        courses = [
            Course(title='Категория B', description='Обучение на легковой автомобиль. Теория и практика.', price=25000,
                   duration='2.5 месяца', category='basic'),
            Course(title='Категория A', description='Обучение на мотоцикл. Для начинающих и опытных.', price=18000,
                   duration='1.5 месяца', category='moto'),
            Course(title='Категория C', description='Обучение на грузовой автомобиль. Профессиональная подготовка.',
                   price=35000, duration='3 месяца', category='truck'),
            Course(title='Категория D', description='Обучение на автобус. Для работы в пассажирских перевозках.',
                   price=40000, duration='3.5 месяца', category='bus')
        ]
        db.session.add_all(courses)
        db.session.commit()
        return 'Курсы добавлены (4 шт.)'
    return 'Курсы уже есть'


if __name__ == '__main__':
    app.run(debug=True)