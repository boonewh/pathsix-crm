from datetime import datetime
from app.database import SessionLocal
from app.models import Lead, User

session = SessionLocal()

leads_to_create = [
    {
        "name": "John Smith",
        "contact_person": "John Smith",
        "email": "john.smith@example.com",
        "phone": "555-111-2222",
        "address": "456 Elm St",
        "city": "Austin",
        "state": "TX",
        "zip": "78701",
        "notes": "Requested quote for backyard turf installation.",
    },
    {
        "name": "Lisa Johnson",
        "contact_person": "Lisa Johnson",
        "email": "lisa.j@example.com",
        "phone": "555-333-4444",
        "address": "789 Oak Ave",
        "city": "Dallas",
        "state": "TX",
        "zip": "75201",
        "notes": "Interested in rockbed redesign.",
    }
]

try:
    # Get the admin user and use their tenant_id
    user = session.query(User).filter_by(email="admin@example.com").first()

    for lead_data in leads_to_create:
        exists = session.query(Lead).filter_by(email=lead_data["email"]).first()
        if not exists:
            new_lead = Lead(
                tenant_id=user.tenant_id,
                created_at=datetime.utcnow(),
                **lead_data
            )
            session.add(new_lead)

    session.commit()
    print("✅ Leads seeded.")
finally:
    session.close()
