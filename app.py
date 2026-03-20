from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
import config

app = Flask(__name__)
app.config.from_object(config.Config)
db.init_app(app)

with app.app_context():
    db.create_all()

# Корневой маршрут для проверки, что сервер работает
@app.route("/")
def index():
    return jsonify({"message": "Сервер работает. Используйте POST /api/auth/register для регистрации."})

# Эндпоинт регистрации
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")

    if not email or not name or not password:
        return jsonify({"error": "Все поля обязательны"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Пользователь с таким email уже существует"}), 400

    password_hash = generate_password_hash(password)
    new_user = User(email=email, name=name, passwordHash=password_hash)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "Пользователь успешно зарегистрирован"}), 201

if __name__ == "__main__":
    app.run(debug=True)