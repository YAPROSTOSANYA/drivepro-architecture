from flask import Flask
from config import Config
from extensions import db

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)

from models import User


@app.route("/")
def index():
    return "DrivePro Server Running"


with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)