from datetime import datetime
from app import create_app
from app.database import SessionLocal
from app.models import Lead

app = create_app()
app.app_context().push()
session = SessionLocal()

leads_to_create = [
    {
        "name": "John Smith",
        "email": "john.smith@example.com",
        "phone": "555-111-2222",
        "address": "456 Elm St"
    },
    {
        "name": "Lisa Johnson",
        "email": "lisa.j@example.com",
        "phone": "555-333-4444",
        "address": "789 Oak Ave"
    }
]

try:
    for lead_data in leads_to_create:
        exists = session.query(Lead).filter_by(email=lead_data["email"]).first()
        if not exists:
            new_lead = Lead(
                client_id=1,
                created_at=datetime.utcnow(),
                **lead_data
            )
            session.add(new_lead)

    session.commit()
    print("✅ Leads seeded.")
finally:
    session.close()
