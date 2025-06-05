from quart import Quart
from quart_cors import cors
from app.config import SECRET_KEY
from app.routes import register_blueprints
from app.utils.keep_alive import keep_db_alive  # 👈 import the task

def create_app():
    app = Quart(__name__)

    # ✅ Add CORS *before* anything else, with credentials
    app = cors(
        app,
        allow_origin=["https://pathsix-crm.vercel.app", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    app.config.from_pyfile("config.py")

    # ✅ Register routes AFTER CORS is applied
    register_blueprints(app)

    # ✅ Add the keep-alive task BEFORE serving starts
    @app.before_serving
    async def startup():
        app.add_background_task(keep_db_alive)

    return app

