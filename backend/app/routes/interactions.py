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
        interactions = session.query(Interaction).filter(
            Interaction.client_id == user.client_id
        ).all()

        return jsonify([
            {
                "id": i.id,
                "contact_date": i.contact_date.isoformat(),
                "summary": i.summary,
                "client_id": i.client_id,
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
        interaction = Interaction(
            client_id=user.client_id,
            contact_date=datetime.fromisoformat(data["contact_date"]),
            summary=data["summary"]
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
            Interaction.client_id == user.client_id
        ).first()

        if not interaction:
            return jsonify({"error": "Interaction not found"}), 404

        if "contact_date" in data:
            interaction.contact_date = datetime.fromisoformat(data["contact_date"])
        if "summary" in data:
            interaction.summary = data["summary"]

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
            Interaction.client_id == user.client_id
        ).first()

        if not interaction:
            return jsonify({"error": "Interaction not found"}), 404

        session.delete(interaction)
        session.commit()
        return jsonify({"message": "Interaction deleted"})
    finally:
        session.close()