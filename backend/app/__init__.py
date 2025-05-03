from quart import Quart
from quart_cors import cors
from app.routes.auth import auth_bp
from app.routes import register_blueprints

def create_app():
    app = Quart(__name__)
    app = cors(app, allow_origin="http://localhost:5173")
    app.register_blueprint(auth_bp)
    return app