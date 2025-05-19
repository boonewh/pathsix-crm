from quart import Blueprint, request, jsonify
from app.database import SessionLocal
from app.models import Client, Lead, Project, Account
from app.utils.auth_utils import requires_auth

search_bp = Blueprint("search", __name__, url_prefix="/api/search")

@search_bp.route("/", methods=["GET"])
@requires_auth()
async def global_search():
    user = request.user
    query = request.args.get("q", "").strip().lower()
    if not query:
        return jsonify([])

    session = SessionLocal()
    try:
        results = []

        is_admin = any(role.name == "admin" for role in user.roles)

        # Client search
        client_q = session.query(Client).filter(
            Client.tenant_id == user.tenant_id,
            Client.deleted_at == None,
            Client.name.ilike(f"%{query}%")
        )
        if not is_admin:
            client_q = client_q.filter(Client.created_by == user.id)

        for c in client_q.limit(5):
            results.append({
                "type": "client",
                "id": c.id,
                "name": c.name,
                "link": f"/clients/{c.id}"
            })

        # Lead search
        lead_q = session.query(Lead).filter(
            Lead.tenant_id == user.tenant_id,
            Lead.deleted_at == None,
            Lead.name.ilike(f"%{query}%")
        )
        if not is_admin:
            lead_q = lead_q.filter(Lead.created_by == user.id)

        for l in lead_q.limit(5):
            results.append({
                "type": "lead",
                "id": l.id,
                "name": l.name,
                "link": f"/leads/{l.id}"
            })

        # Project search
        project_q = session.query(Project).filter(
            Project.tenant_id == user.tenant_id,
            Project.project_name.ilike(f"%{query}%")
        )
        if not is_admin:
            project_q = project_q.filter(Project.created_by == user.id)

        for p in project_q.limit(5):
            link = f"/clients/{p.client_id}" if p.client_id else f"/leads/{p.lead_id}"
            results.append({
                "type": "project",
                "id": p.id,
                "name": p.project_name,
                "link": link
            })

        # Account search
        account_q = session.query(Account).filter(
            Account.tenant_id == user.tenant_id,
            Account.account_name.ilike(f"%{query}%")
        )
        if not is_admin:
            account_q = account_q.join(Client).filter(Client.created_by == user.id)

        for a in account_q.limit(5):
            results.append({
                "type": "account",
                "id": a.id,
                "name": a.account_name or a.account_number,
                "link": f"/clients/{a.client_id}"
            })

        return jsonify(results)

    finally:
        session.close()
