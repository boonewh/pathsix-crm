from datetime import datetime
from app import create_app
from app.database import SessionLocal
from app.models import Project, Lead, Client, User

app = create_app()
app.app_context().push()
session = SessionLocal()

try:
    lead = session.query(Lead).filter_by(client_id=1).first()
    client = session.query(Client).filter_by(client_id=1).first()
    user = session.query(User).filter_by(email="admin@example.com").first()

    projects_to_create = [
        {
            "title": "Rock Removal",
            "status": "pending",
            "lead_id": lead.id if lead else None,
            "client_id": client.id if client else None,
            "created_at": datetime(2024, 9, 1),
        },
        {
            "title": "Turf Installation",
            "status": "won",
            "lead_id": lead.id if lead else None,
            "client_id": client.id if client else None,
            "created_at": datetime(2024, 10, 1),
        },
    ]

    for data in projects_to_create:
        exists = session.query(Project).filter_by(title=data["title"]).first()
        if not exists:
            new_project = Project(
                **data
            )
            session.add(new_project)

    session.commit()
    print("✅ Projects seeded.")
finally:
    session.close()
