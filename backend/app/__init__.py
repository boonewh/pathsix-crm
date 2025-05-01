from quart import Quart
from routes.auth import auth_bp

def create_app():
    app = Quart(__name__)
    app.register_blueprint(auth_bp)
    return app
