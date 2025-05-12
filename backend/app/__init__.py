from quart import Quart
from quart_cors import cors
from app.config import SECRET_KEY
from app.routes import register_blueprints

def create_app():
    app = Quart(__name__)
    app = cors(app, allow_origin="http://localhost:5173")
    app.config.from_pyfile("config.py")

    register_blueprints(app)
    return app

