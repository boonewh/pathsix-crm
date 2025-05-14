from datetime import datetime
from app.database import SessionLocal
from app.models import Project, Lead, Client, User

session = SessionLocal()

try:
    user = session.query(User).filter_by(email="admin@example.com").first()
    lead = session.query(Lead).filter_by(email="john.smith@example.com", tenant_id=user.tenant_id).first()
    client = session.query(Client).filter_by(email="jane.doe@acmecorp.com", tenant_id=user.tenant_id).first()

    if not client or not lead:
        raise Exception("❌ Seed failed: missing lead or client.")

    projects_to_create = [
        {
            "tenant_id": user.tenant_id,
            "client_id": client.id,
            "lead_id": None,
            "project_name": "Rock Removal",
            "project_status": "pending",
            "project_description": "Clear rocky terrain for future installation.",
            "project_start": datetime(2024, 9, 1),
            "project_end": datetime(2024, 9, 10),
            "project_worth": 3500.00,
            "created_by": user.id,
            "last_updated_by": user.id,
            "created_at": datetime.utcnow()
        },
        {
            "tenant_id": user.tenant_id,
            "client_id": None,
            "lead_id": lead.id,
            "project_name": "Turf Installation",
            "project_status": "won",
            "project_description": "Install premium turf across designated areas.",
            "project_start": datetime(2024, 10, 1),
            "project_end": datetime(2024, 10, 5),
            "project_worth": 5800.00,
            "created_by": user.id,
            "last_updated_by": user.id,
            "created_at": datetime.utcnow()
        }
    ]

    for data in projects_to_create:
        exists = session.query(Project).filter_by(project_name=data["project_name"]).first()
        if not exists:
            session.add(Project(**data))

    session.commit()
    print("✅ Projects seeded with valid lead/client links.")
finally:
    session.close()
