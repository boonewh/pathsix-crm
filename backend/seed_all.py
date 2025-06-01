from datetime import datetime, timezone
from app.database import SessionLocal, Base, engine
from app.models import User, Role, Client, Lead, Project, Interaction, Account
from app.utils.auth_utils import hash_password

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

session = SessionLocal()

try:
    # Roles
    admin_role = Role(name="admin")
    user_role = Role(name="user")
    session.add_all([admin_role, user_role])
    session.flush()

    # Users
    admin_user = User(
        email="admin@example.com",
        password_hash=hash_password("password123"),
        tenant_id=1,
        roles=[admin_role]
    )
    sales_user = User(
        email="sales@allseasonsfoam.com",
        password_hash=hash_password("password123"),
        tenant_id=1,
        roles=[user_role]
    )
    session.add_all([admin_user, sales_user])
    session.flush()

    ### Admin's records ###
    client1 = Client(
        tenant_id=1,
        created_by=admin_user.id,
        name="Refinery Services Group",
        contact_person="Admin Contact",
        contact_title="Operations Manager",
        email="refinery@rsg.com",
        phone="555-000-0001",
        address="100 Industrial Way",
        city="Midland",
        state="TX",
        zip="79701",
        notes="Frequent contracts for secondary containment coatings.",
        created_at=datetime.now(timezone.utc)
    )
    session.add(client1)
    session.flush()

    account1 = Account(
        tenant_id=1,
        client_id=client1.id,
        account_number="RSG-001",
        account_name="Containment Systems",
        notes="Active service contract for multi-year coatings.",
        opened_on=datetime.now(timezone.utc)
    )
    session.add(account1)

    lead1 = Lead(
        tenant_id=1,
        created_by=admin_user.id,
        name="Dusty Roads Transport",
        contact_person="Bill Haul",
        contact_title="Fleet Manager",
        email="bill@dustyroads.com",
        phone="555-000-0002",
        address="321 Freight Ln",
        city="Odessa",
        state="TX",
        zip="79765",
        notes="Needs truck bed liners with fast-set polyurea.",
        created_at=datetime.now(timezone.utc)
    )
    session.add(lead1)
    session.flush()

    project1 = Project(
        tenant_id=1,
        created_by=admin_user.id,
        client_id=client1.id,
        project_name="Fuel Tank Coating - Plant A",
        project_description="Polyurea coating on diesel fuel tank exterior.",
        project_status="pending",
        project_start=datetime(2025, 6, 10, tzinfo=timezone.utc),
        project_end=datetime(2025, 6, 20, tzinfo=timezone.utc),
        project_worth=54000,
        created_at=datetime.now(timezone.utc)
    )
    session.add(project1)

    interaction1 = Interaction(
        tenant_id=1,
        client_id=client1.id,
        contact_person="Admin Contact",
        email="refinery@rsg.com",
        phone="555-000-0001",
        contact_date=datetime.now(timezone.utc),
        summary="Pre-inspection walkthrough.",
        outcome="Cleared for project start.",
        notes="Minor prep work needed on western wall.",
        follow_up=datetime(2025, 5, 28, 10, 0, tzinfo=timezone.utc)
    )
    session.add(interaction1)

    ### User's records ###
    client2 = Client(
        tenant_id=1,
        created_by=sales_user.id,
        name="AgPro Warehouse Systems",
        contact_person="Deb Farmer",
        contact_title="Facilities Director",
        email="deb@agprosystems.com",
        phone="555-000-0101",
        address="789 Grain Loop",
        city="Lamesa",
        state="TX",
        zip="79331",
        notes="Interested in roof foam insulation and sidewall coating.",
        created_at=datetime.now(timezone.utc)
    )
    session.add(client2)
    session.flush()

    account2 = Account(
        tenant_id=1,
        client_id=client2.id,
        account_number="AGPRO-2025",
        account_name="Facility Upgrade Phase 1",
        notes="Foam install on grain warehouse roofs.",
        opened_on=datetime.now(timezone.utc)
    )
    session.add(account2)

    lead2 = Lead(
        tenant_id=1,
        created_by=sales_user.id,
        name="Southern Livestock Markets",
        contact_person="Travis Steele",
        contact_title="Yard Supervisor",
        email="travis@slivestock.com",
        phone="555-000-0102",
        address="1501 Stockyard Blvd",
        city="San Angelo",
        state="TX",
        zip="76903",
        notes="Requesting info on abrasion-resistant polyurea pens.",
        created_at=datetime.now(timezone.utc)
    )
    session.add(lead2)
    session.flush()

    project2 = Project(
        tenant_id=1,
        created_by=sales_user.id,
        client_id=client2.id,
        project_name="Warehouse Roof Retrofit",
        project_description="Closed-cell foam and polyurea topcoat.",
        project_status="pending",
        project_start=datetime(2025, 7, 15, tzinfo=timezone.utc),
        project_end=datetime(2025, 8, 15, tzinfo=timezone.utc),
        project_worth=82000,
        created_at=datetime.now(timezone.utc)
    )
    session.add(project2)

    interaction2 = Interaction(
        tenant_id=1,
        client_id=client2.id,
        contact_person="Deb Farmer",
        email="deb@agprosystems.com",
        phone="555-000-0101",
        contact_date=datetime.now(timezone.utc),
        summary="Discussed roof lifespan and insulation performance.",
        outcome="Wants pricing within two weeks.",
        notes="Requested product spec sheets for AgSeal-30.",
        follow_up=datetime(2025, 5, 25, 14, 30, tzinfo=timezone.utc)
    )
    session.add(interaction2)

    session.commit()
    print("✅ Demo database seeded: 1 client + lead per user, clearly separated.")
finally:
    session.close()
