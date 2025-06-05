from quart import Quart
from quart_cors import cors
from app.config import SECRET_KEY
from app.routes import register_blueprints
from app.utils.keep_alive import keep_db_alive  # ✅ this still works
from app.database import SessionLocal
import asyncio

# 👇 Add warmup function directly here
async def warmup_db():
    retries = 5
    delay = 2
    while retries > 0:
        try:
            session = SessionLocal()
            session.execute("SELECT 1")
            session.close()
            print("[Warmup] Postgres is ready.")
            return
        except Exception as e:
            print(f"[Warmup] Waiting for DB... ({retries} left) {e}")
            await asyncio.sleep(delay)
            retries -= 1
    print("[Warmup] Gave up waiting for DB.")

def create_app():
    app = Quart(__name__)

    # ✅ Add CORS *before* anything else
    app = cors(
        app,
        allow_origin=["https://pathsix-crm.vercel.app", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    app.config.from_pyfile("config.py")
    register_blueprints(app)

    # ✅ Before serving: warm up DB, then start keep-alive
    @app.before_serving
    async def startup():
        await warmup_db()
        app.add_background_task(keep_db_alive)

    return app
