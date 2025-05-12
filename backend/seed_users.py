import uuid
from app import create_app
from app.database import SessionLocal
from app.models import User, Role
from app.utils.auth_utils import hash_password

app = create_app()
app.app_context().push()
session = SessionLocal()

try:
    # Create roles
    admin_role = session.query(Role).filter_by(name="admin").first()
    if not admin_role:
        admin_role = Role(name="admin")
        session.add(admin_role)

    user_role = session.query(Role).filter_by(name="user").first()
    if not user_role:
        user_role = Role(name="user")
        session.add(user_role)

    # Create admin user
    if not session.query(User).filter_by(email="admin@example.com").first():
        admin_user = User(
            email="admin@example.com",
            password_hash=hash_password("password123"),
            client_id=1,
            roles=[admin_role]
        )
        session.add(admin_user)

    # Create standard user
    if not session.query(User).filter_by(email="user@example.com").first():
        standard_user = User(
            email="user@example.com",
            password_hash=hash_password("password123"),
            client_id=1,
            roles=[user_role]
        )
        session.add(standard_user)

    session.commit()
    print("✅ Users and roles seeded.")
finally:
    session.close()