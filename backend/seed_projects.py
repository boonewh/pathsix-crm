from datetime import datetime
from app.database import SessionLocal
from app.models import Project, Lead, Client, User

session = SessionLocal()

try:
    lead = session.query(Lead).filter_by(client_id=1).first()
    client = session.query(Client).filter_by(client_id=1).first()
    user = session.query(User).filter_by(email="admin@example.com").first()

    projects_to_create = [
        {
            "project_name": "Rock Removal",
            "project_status": "pending",
            "project_description": "Clear rocky terrain for future installation.",
            "project_start": datetime(2024, 9, 1),
            "project_end": datetime(2024, 9, 10),
            "project_worth": 3500.00,
            "lead_id": lead.id if lead else None,
            "client_id": client.id if client else None,
            "created_at": datetime.utcnow(),
            "created_by": user.id,
            "last_updated_by": user.id,
        },
        {
            "project_name": "Turf Installation",
            "project_status": "won",
            "project_description": "Install premium turf across designated areas.",
            "project_start": datetime(2024, 10, 1),
            "project_end": datetime(2024, 10, 5),
            "project_worth": 5800.00,
            "lead_id": lead.id if lead else None,
            "client_id": client.id if client else None,
            "created_at": datetime.utcnow(),
            "created_by": user.id,
            "last_updated_by": user.id,
        },
    ]

    for data in projects_to_create:
        exists = session.query(Project).filter_by(project_name=data["project_name"]).first()
        if not exists:
            session.add(Project(**data))

    session.commit()
    print("✅ Projects seeded.")
finally:
    session.close()
