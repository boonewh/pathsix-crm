from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Interaction, Client, Lead, User

session = SessionLocal()

try:
    user = session.query(User).filter_by(email="admin@example.com").first()
    lead = session.query(Lead).filter_by(email="john.smith@example.com", tenant_id=user.tenant_id).first()
    client = session.query(Client).filter_by(email="jane.doe@acmecorp.com", tenant_id=user.tenant_id).first()

    if not client or not lead:
        raise Exception("❌ Seed failed: missing lead or client.")

    interactions_to_create = [
        {
            "tenant_id": user.tenant_id,
            "client_id": client.id,
            "lead_id": None,
            "phone": "555-555-5555",
            "email": "client@example.com",
            "contact_person": "Jane Doe",
            "contact_date": datetime.utcnow() - timedelta(days=3),
            "summary": "Initial phone consultation regarding project scope.",
            "outcome": "Interested - needs proposal",
            "notes": "Client was receptive, follow up with proposal next week.",
            "follow_up": datetime.utcnow() + timedelta(days=4)
        },
        {
            "tenant_id": user.tenant_id,
            "client_id": None,
            "lead_id": lead.id,
            "phone": "555-555-5555",
            "email": "client@example.com",
            "contact_person": "Jane Doe",
            "contact_date": datetime.utcnow() - timedelta(days=1),
            "summary": "Sent proposal via email.",
            "outcome": "Proposal sent",
            "notes": "Waiting for response, check in mid-week.",
            "follow_up": datetime.utcnow() + timedelta(days=2)
        }
    ]

    for data in interactions_to_create:
        session.add(Interaction(**data))

    session.commit()
    print("✅ Interactions seeded with correct ownership.")
finally:
    session.close()
