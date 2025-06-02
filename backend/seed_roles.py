from app.database import SessionLocal
from app.models import Role

session = SessionLocal()

for name in ["admin", "user"]:
    if not session.query(Role).filter_by(name=name).first():
        session.add(Role(name=name))

session.commit()
session.close()

print("✅ Roles seeded.")