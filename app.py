from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from models import db, User, Item
from datetime import timedelta

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret'  # На боевом проекте использовать env
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

db.init_app(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

with app.app_context():
    db.create_all()

# ----------------------------
# Аутентификация
# ----------------------------
@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    name = data.get("name")
    password = data.get("password")
    if not email or not name or not password:
        return jsonify({"message": "Все поля обязательны"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Пользователь уже существует"}), 400
    passwordHash = bcrypt.generate_password_hash(password).decode('utf-8')
    user = User(email=email, name=name, passwordHash=passwordHash)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Пользователь успешно зарегистрирован"})

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if user and bcrypt.check_password_hash(user.passwordHash, password):
        token = create_access_token(identity=user.id)
        return jsonify({"token": token})
    return jsonify({"message": "Неверные данные"}), 401

@app.route("/api/auth/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "createdAt": user.createdAt
    })

# ----------------------------
# CRUD для Item
# ----------------------------
@app.route("/api/items", methods=["POST"])
@jwt_required()
def create_item():
    data = request.get_json()
    title = data.get("title")
    description = data.get("description", "")
    if not title:
        return jsonify({"message": "Title обязателен"}), 400
    item = Item(title=title, description=description)
    db.session.add(item)
    db.session.commit()
    return jsonify({"id": item.id, "title": item.title, "description": item.description})

@app.route("/api/items", methods=["GET"])
def get_items():
    items = Item.query.all()
    return jsonify([{"id": i.id, "title": i.title, "description": i.description} for i in items])

if __name__ == "__main__":
    app.run(debug=True)