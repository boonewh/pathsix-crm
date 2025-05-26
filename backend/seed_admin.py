from app.models import User, Role, Base
from app.database import SessionLocal, engine
from datetime import datetime
import bcrypt

# Ensure tables exist (for safety)
Base.metadata.create_all(bind=engine)

session = SessionLocal()

# Step 1: Create tenant_id (we'll use 1 manually for now — later you'll want a proper tenants table)
tenant_id = 1

# Step 2: Create 'admin' role if missing
admin_role = session.query(Role).filter_by(name="admin").first()
if not admin_role:
    admin_role = Role(name="admin")
    session.add(admin_role)
    session.commit()

# Step 3: Create admin user if not exists
admin_email = "admin098@allseasonsfoam.com"
existing = session.query(User).filter_by(email=admin_email).first()

if not existing:
    hashed_pw = bcrypt.hashpw(b"a11seas0ns098", bcrypt.gensalt()).decode("utf-8")
    admin = User(
        email=admin_email,
        password_hash=hashed_pw,
        is_active=True,
        created_at=datetime.utcnow(),
        tenant_id=tenant_id,
        roles=[admin_role]
    )
    session.add(admin)
    session.commit()
    print("✅ Admin user created.")
else:
    print("ℹ️ Admin user already exists.")

session.close()
