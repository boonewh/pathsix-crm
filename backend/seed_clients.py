from datetime import datetime
from app.database import SessionLocal
from app.models import Client

session = SessionLocal()

try:
    existing = session.query(Client).filter_by(client_id=1).first()

    if not existing:
        new_client = Client(
            client_id=1,
            name="Acme Corp",
            contact_person="Jane Doe",
            email="jane.doe@acmecorp.com",
            phone="555-123-4567",
            address="123 Main St",
            city="Metropolis",
            state="TX",
            zip="75001",
            notes="VIP client, interested in long-term contract.",
            created_at=datetime.utcnow()
        )
        session.add(new_client)
        session.commit()
        print("✅ Client seeded.")
    else:
        print("ℹ️ Client with client_id=1 already exists.")
finally:
    session.close()

