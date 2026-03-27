from flask import Flask, request, jsonify, render_template, session, redirect
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

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


# Создание таблиц
with app.app_context():
    db.create_all()
    print("База данных создана")


# ================= СТРАНИЦЫ ФРОНТЕНДА =================
# Страницы аутентификации (по требованию лабы)
@app.route('/auth/login')
def auth_login_page():
    return render_template('main.html', page='login')


@app.route('/auth/register')
def auth_register_page():
    return render_template('main.html', page='register')


# Дополнительно оставляем старые URL для удобства (не мешает)
@app.route('/')
def login_page():
    return render_template('main.html', page='login')


@app.route('/register')
def register_page():
    return render_template('main.html', page='register')


# Приватная страница
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

        # Валидация
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'success': False, 'message': 'Все поля обязательны'}), 400

        # Проверка существующего пользователя
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Пользователь уже существует'}), 400

        # Создание пользователя
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

        # Валидация
        if not data.get('email') or not data.get('password'):
            return jsonify({'success': False, 'message': 'Email и пароль обязательны'}), 400

        # Поиск пользователя
        user = User.query.filter_by(email=data['email']).first()

        # Проверка пароля
        if not user or not user.check_password(data['password']):
            return jsonify({'success': False, 'message': 'Неверный email или пароль'}), 401

        # Сохраняем в сессию
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


# ================= API ДЛЯ ITEMS (CRUD) =================
@app.route('/api/items', methods=['GET'])
def get_items():
    # Проверка авторизации
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
    # Проверка авторизации
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    try:
        data = request.get_json()

        # Валидация
        if not data.get('title'):
            return jsonify({'success': False, 'message': 'Название обязательно'}), 400

        # Создание элемента
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
    # Проверка авторизации
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': 'Не авторизован'}), 401

    try:
        # Поиск элемента
        item = Item.query.filter_by(id=item_id, user_id=session['user_id']).first()

        if not item:
            return jsonify({'success': False, 'message': 'Элемент не найден'}), 404

        # Удаление
        db.session.delete(item)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Элемент удален'}), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)