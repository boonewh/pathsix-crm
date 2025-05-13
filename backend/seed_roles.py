from app.database import SessionLocal
from app.models import Role

session = SessionLocal()

try:
    roles = ["admin", "manager", "staff"]

    for role_name in roles:
        exists = session.query(Role).filter_by(name=role_name).first()
        if not exists:
            session.add(Role(name=role_name))

    session.commit()
    print("✅ Roles seeded.")
finally:
    session.close()
