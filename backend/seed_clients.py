from datetime import datetime, timezone
from app.database import SessionLocal
from app.models import Client, User

session = SessionLocal()

try:
    # Find the admin user
    admin = session.query(User).filter_by(email="admin@example.com").first()
    if not admin:
        raise Exception("Admin user not found. Run seed_users.py first.")

    existing = session.query(Client).filter_by(tenant_id=1).first()

    if not existing:
        new_client = Client(
            tenant_id=1,
            created_by=admin.id,  # ✅ required
            name="Acme Corp",
            contact_person="Jane Doe",
            email="jane.doe@acmecorp.com",
            phone="555-123-4567",
            address="123 Main St",
            city="Metropolis",
            state="TX",
            zip="75001",
            notes="VIP client, interested in long-term contract.",
            created_at=datetime.now(timezone.utc)
        )
        session.add(new_client)
        session.commit()
        print("✅ Client seeded.")
    else:
        print("ℹ️ Client with tenant_id=1 already exists.")
finally:
    session.close()

