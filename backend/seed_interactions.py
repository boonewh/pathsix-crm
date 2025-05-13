from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Interaction, Client, Lead

session = SessionLocal()

try:
    lead = session.query(Lead).filter_by(client_id=1).first()
    client = session.query(Client).filter_by(client_id=1).first()

    interactions_to_create = [
        {
            "lead_id": lead.id if lead else None,
            "client_id": client.id if client else None,
            "contact_date": datetime.utcnow() - timedelta(days=3),
            "summary": "Initial phone consultation regarding project scope.",
            "outcome": "Interested - needs proposal",
            "notes": "Client was receptive, follow up with proposal next week.",
            "follow_up": datetime.utcnow() + timedelta(days=4)
        },
        {
            "lead_id": lead.id if lead else None,
            "client_id": client.id if client else None,
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
    print("✅ Interactions seeded.")
finally:
    session.close()
