from flask import Flask, render_template, request, redirect, url_for, session
from config import Config
from models import db, User  # импортируем только db и модели

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)  # инициализируем db с приложением

# создаём все таблицы при старте приложения
with app.app_context():
    db.create_all()

@app.route("/")
def index():
    return redirect(url_for("login_page"))

@app.route("/auth/login")
def login_page():
    return render_template("main.html", page="login")

@app.route("/auth/register")
def register_page():
    return render_template("main.html", page="register")

@app.route("/profile")
def profile_page():
    # временный пользователь для отображения
    user = {"name": "Саня"}
    return render_template("main.html", page="profile", user=user)

if __name__ == "__main__":
    app.run(debug=True)