from quart import Blueprint, request, jsonify
from datetime import datetime
from app.models import Interaction
from app.database import SessionLocal
from app.utils.auth_utils import requires_auth

interactions_bp = Blueprint("interactions", __name__, url_prefix="/api/interactions")

@interactions_bp.route("/", methods=["GET"])
@requires_auth()
async def list_interactions():
    user = request.user
    session = SessionLocal()
    try:
        client_id = request.args.get("client_id")
        lead_id = request.args.get("lead_id")

        if client_id and lead_id:
            return jsonify({"error": "Cannot filter by both client_id and lead_id"}), 400

        query = session.query(Interaction).filter(Interaction.tenant_id == user.tenant_id)

        if client_id:
            query = query.filter(
                Interaction.client_id == int(client_id),
                Interaction.lead_id == None
            )
        elif lead_id:
            query = query.filter(
                Interaction.lead_id == int(lead_id),
                Interaction.client_id == None
            )

        interactions = query.order_by(Interaction.contact_date.desc()).all()

        return jsonify([
            {
                "id": i.id,
                "contact_date": i.contact_date.isoformat(),
                "follow_up": i.follow_up.isoformat() if i.follow_up else None,
                "summary": i.summary,
                "outcome": i.outcome,
                "notes": i.notes,
                "client_id": i.client_id,
                "lead_id": i.lead_id,
                "client_name": i.client.name if i.client else None,
                "lead_name": i.lead.name if i.lead else None,
                "contact_person": i.contact_person,
                "email": i.email,
                "phone": i.phone,
                "profile_link": f"/clients/{i.client_id}" if i.client_id else f"/leads/{i.lead_id}" if i.lead_id else None
            } for i in interactions
        ])
    finally:
        session.close()

@interactions_bp.route("/", methods=["POST"])
@requires_auth()
async def create_interaction():
    data = await request.get_json()
    user = request.user
    session = SessionLocal()
    try:
        # Enforce: must link to one and only one of client or lead
        if bool(data.get("client_id")) == bool(data.get("lead_id")):
            return jsonify({"error": "Interaction must link to either client_id or lead_id, not both or neither."}), 400

        interaction = Interaction(
            tenant_id=user.tenant_id,
            client_id=int(data["client_id"]) if data.get("client_id") else None,
            lead_id=int(data["lead_id"]) if data.get("lead_id") else None,
            contact_date=datetime.fromisoformat(data["contact_date"]),
            summary=data["summary"],
            outcome=data.get("outcome"),
            notes=data.get("notes"),
            follow_up=datetime.fromisoformat(data["follow_up"]) if data.get("follow_up") else None,
            contact_person=data.get("contact_person"),
            email=data.get("email"),
            phone=data.get("phone")
        )
        session.add(interaction)
        session.commit()
        session.refresh(interaction)

        return jsonify({"id": interaction.id}), 201
    finally:
        session.close()

@interactions_bp.route("/<int:interaction_id>", methods=["PUT"])
@requires_auth()
async def update_interaction(interaction_id):
    data = await request.get_json()
    user = request.user
    session = SessionLocal()
    try:
        interaction = session.query(Interaction).filter(
            Interaction.id == interaction_id,
            Interaction.tenant_id == user.tenant_id
        ).first()

        if not interaction:
            return jsonify({"error": "Interaction not found"}), 404

        for field in [
            "contact_date", "summary", "outcome",
            "notes", "follow_up", "contact_person", "email", "phone"
        ]:
            if field in data:
                if field in ["contact_date", "follow_up"] and data[field]:
                    setattr(interaction, field, datetime.fromisoformat(data[field]))
                else:
                    setattr(interaction, field, data[field])

        session.commit()
        session.refresh(interaction)
        return jsonify({"id": interaction.id})
    finally:
        session.close()

@interactions_bp.route("/<int:interaction_id>", methods=["DELETE"])
@requires_auth()
async def delete_interaction(interaction_id):
    user = request.user
    session = SessionLocal()
    try:
        interaction = session.query(Interaction).filter(
            Interaction.id == interaction_id,
            Interaction.tenant_id == user.tenant_id
        ).first()

        if not interaction:
            return jsonify({"error": "Interaction not found"}), 404

        session.delete(interaction)
        session.commit()
        return jsonify({"message": "Interaction deleted"})
    finally:
        session.close()
