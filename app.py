from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Модель пользователя
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Инициализация базы
with app.app_context():
    db.create_all()

# Эндпоинт регистрации
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data.get("email") or not data.get("name") or not data.get("password"):
        return jsonify({"message": "Заполните все поля"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "Пользователь с таким email уже существует"}), 400

    user = User(name=data["name"], email=data["email"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Пользователь успешно зарегистрирован"})

# Эндпоинт логина
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Неверный email или пароль"}), 401

    # Генерируем простой токен
    token = str(user.id)
    return jsonify({"message": "Вход успешен", "token": token})

# Эндпоинт приватного профиля
@app.route("/api/auth/me", methods=["GET"])
def me():
    token = request.headers.get("Authorization")
    if not token:
        return jsonify({"message": "Требуется токен"}), 401

    user = User.query.get(token)
    if not user:
        return jsonify({"message": "Пользователь не найден"}), 404

    return jsonify({"id": user.id, "name": user.name, "email": user.email})

# Проверка сервера
@app.route("/", methods=["GET"])
def index():
    return jsonify({"message": "Сервер работает. Используйте POST /api/auth/register для регистрации."})

if __name__ == "__main__":
    app.run(debug=True)