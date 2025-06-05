import asyncio
from sqlalchemy.exc import SQLAlchemyError
from app.database import SessionLocal

async def keep_db_alive():
    while True:
        try:
            session = SessionLocal()
            session.execute("SELECT 1")
            session.close()
            print("[KeepAlive] DB pinged successfully.")
        except SQLAlchemyError as e:
            print(f"[KeepAlive] DB ping failed: {e}")
        await asyncio.sleep(300)  # 5 minutes
