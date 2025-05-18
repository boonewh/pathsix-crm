from quart import Blueprint, jsonify, request
from sqlalchemy import func, desc
from app.database import SessionLocal
from app.models import ActivityLog, Client, Lead, Project, Account
from app.utils.auth_utils import requires_auth

activity_bp = Blueprint("activity", __name__, url_prefix="/api/activity")

@activity_bp.route("/recent", methods=["GET"])
@requires_auth()
async def recent_activity():
    user = request.user
    session = SessionLocal()
    try:
        # Get most recent log per entity_type + entity_id for this user
        subquery = (
            session.query(
                ActivityLog.entity_type,
                ActivityLog.entity_id,
                func.max(ActivityLog.timestamp).label("last_touched")
            )
            .filter(ActivityLog.user_id == user.id)
            .group_by(ActivityLog.entity_type, ActivityLog.entity_id)
            .subquery()
        )

        results = session.query(
            subquery.c.entity_type,
            subquery.c.entity_id,
            subquery.c.last_touched
        ).order_by(desc(subquery.c.last_touched)).limit(10).all()

        output = []
        for row in results:
            entity_type = row.entity_type
            entity_id = row.entity_id
            last_touched = row.last_touched
            name = None
            profile_link = None

            if entity_type == "client":
                client = session.get(Client, entity_id)
                if client:
                    name = client.name
                    profile_link = f"/clients/{client.id}"

            elif entity_type == "lead":
                lead = session.get(Lead, entity_id)
                if lead:
                    name = lead.name
                    profile_link = f"/leads/{lead.id}"

            elif entity_type == "project":
                project = session.get(Project, entity_id)
                if project:
                    name = project.project_name
                    if project.client_id:
                        profile_link = f"/clients/{project.client_id}"
                    elif project.lead_id:
                        profile_link = f"/leads/{project.lead_id}"

            elif entity_type == "account":
                account = session.get(Account, entity_id)
                if account and account.client:
                    name = account.account_name or account.account_number
                    profile_link = f"/clients/{account.client.id}"

            if name and profile_link:
                output.append({
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "name": name,
                    "last_touched": last_touched.isoformat(),
                    "profile_link": profile_link
                })

        return jsonify(output)

    finally:
        session.close()
