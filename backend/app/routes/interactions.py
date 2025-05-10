from quart import Blueprint, request, jsonify
from app.database import SessionLocal
from app.utils.security import verify_token
from app.models import Interaction
from datetime import datetime

interactions_bp = Blueprint("interactions", __name__, url_prefix="/api/interactions")

@interactions_bp.route("/<int:interaction_id>", methods=["PUT"])
async def update_interaction(interaction_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    data = await request.get_json()
    db = SessionLocal()
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()

    if not interaction:
        return jsonify({"error": "Interaction not found"}), 404

    interaction.contact_date = datetime.fromisoformat(data.get("contact_date")) if data.get("contact_date") else interaction.contact_date
    interaction.outcome = data.get("outcome", interaction.outcome)
    interaction.notes = data.get("notes", interaction.notes)
    interaction.follow_up = datetime.fromisoformat(data.get("follow_up")) if data.get("follow_up") else None

    db.commit()
    db.refresh(interaction)

    return jsonify({
        "id": interaction.id,
        "lead_id": interaction.lead_id,
        "client_id": interaction.client_id,
        "contact_date": interaction.contact_date.isoformat(),
        "outcome": interaction.outcome,
        "notes": interaction.notes,
        "follow_up": interaction.follow_up.isoformat() if interaction.follow_up else None
    })


@interactions_bp.route("/<int:interaction_id>", methods=["DELETE"])
async def delete_interaction(interaction_id):
    payload, error_response, status = verify_token(request)
    if error_response:
        return jsonify(error_response), status

    db = SessionLocal()
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()

    if not interaction:
        return jsonify({"error": "Interaction not found"}), 404

    db.delete(interaction)
    db.commit()
    return jsonify({"message": "Interaction deleted"})
